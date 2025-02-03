import fs from 'fs';
import path from 'path';
import { taskLogger } from 'rizom/utils/logger/index.js';
import cache from '../cache/index.js';
import type { BuiltConfig, CompiledConfig } from 'rizom/types/config.js';
import { privateFieldNames } from 'rizom/collection/auth/privateFields.server';
import { PACKAGE_NAME } from 'rizom/constant';
import type { FieldsComponents } from 'rizom/types/panel';
import type { FieldsType } from 'rizom/types';
import { RizomFormError } from 'rizom/errors/index.js';

let hasEnv = false;
const functionRegistry = new Map<string, string>();
let functionCounter = 0;
const importRegistry = new Map<string, string>();
let importCounter = 0;

// Determines what should be included in browser config
function shouldIncludeInBrowser(key: string, value: any): boolean {
	// Exclude these keys entirely
	if (
		[
			'trustedOrigins',
			'database',
			'panel',
			'smtp',
			'routes',
			'plugins',
			'toSchema',
			'toType',
			'hooks'
		].includes(key)
	)
		return false;

	// For objects, exclude specific properties
	if (typeof value === 'object' && value !== null) {
		if ('name' in value && 'type' in value) {
			if (privateFieldNames.includes(value.name)) {
				return false;
			}
		}
		if ('server' in value) {
			return false;
		}
	}

	return true;
}

// Handles import paths for components and modules
function createImportStatement(path: string): string {
	let importPath;

	// Handle Svelte components from src
	if (path.endsWith('.svelte') && !path.includes('node_modules')) {
		const componentPath = path.split('src/').pop() ?? '';
		importPath = `'../${componentPath}'`;
	} else if (path.match(/rizom\/dist\/fields\/(.+?)\/component\/(.+?)\.svelte/)) {
		const modulePath = path.split('node_modules/').pop() ?? '';
		importPath = modulePath.replace(
			/rizom\/dist\/fields\/(.+?)\/component\/(.+?)\.svelte/,
			`'${PACKAGE_NAME}/fields/components'`
		);
	}
	// Handle node_modules imports
	else if (path.includes('node_modules')) {
		const modulePath = path.split('node_modules/').pop() ?? '';
		importPath = `'${modulePath.replace('dist/', '').replace('.svelte', '')}'`;
	} else {
		importPath = path;
	}

	return registerImport(importPath);
}

function cleanViteImports(str: string) {
	// Replace RizomFormError.CONSTANT with it's value
	str = str.replace(/__vite_ssr_import_\d+__\.RizomFormError\.([A-Z_]+)/g, (_, key) =>
		JSON.stringify(RizomFormError[key as keyof typeof RizomFormError])
	);
	str = str.replace(/__vite_ssr_import_\d+__\.(access|validate)/g, '$1');
	return str;
}

function registerImport(importPath: string): string {
	// Check if already registered
	for (const [key, value] of importRegistry.entries()) {
		if (value === importPath) {
			return key;
		}
	}

	const importName = `import_${importCounter++}`;
	importRegistry.set(importName, importPath);
	return importName;
}

function registerFunction(func: Function, key: string = ''): string {
	let funcString = func.toString();

	// Handle environment variables
	const processEnvReg = /process\.env\.PUBLIC_([A-Z_]+)/gm;
	if (processEnvReg.test(funcString)) {
		hasEnv = true;
		funcString = funcString.replace(processEnvReg, (_: string, p1: string) => `env.PUBLIC_${p1}`);
	}

	// Clean vite imports
	funcString = cleanViteImports(funcString);

	// Check if we already have this function
	for (const [existingKey, value] of functionRegistry.entries()) {
		if (value === funcString) {
			return existingKey;
		}
	}

	// Create prefix based on key or default to 'fn'
	const prefix = key ? `${key}Fn` : 'fn';
	const functionName = `${prefix}_${functionCounter++}`;
	functionRegistry.set(functionName, funcString);
	return functionName;
}

// Parse different value types
function parseValue(key: string, value: any): string | boolean | number {
	if (!shouldIncludeInBrowser(key, value)) return '';

	// Handle different value types
	switch (typeof value) {
		case 'function': {
			const filename = (value as any).filename || getSymbolFilename(value);
			if (filename) return createImportStatement(filename);
			return registerFunction(value, key);
		}

		case 'object': {
			if (value === null) return 'null';
			if (Array.isArray(value)) {
				return `[${value
					.map((item) => parseValue('', item))
					.filter(Boolean)
					.join(',')}]`;
			}
			// Handle objects
			const entries = Object.entries(value)
				.filter(([k, v]) => shouldIncludeInBrowser(k, v))
				.map(([k, v]) => `'${k}': ${parseValue(k, v)}`);
			return `{${entries.join(',')}}`;
		}

		case 'string': {
			if (value.includes('node_modules') || value.endsWith('.svelte')) {
				return createImportStatement(value);
			}
			return JSON.stringify(value);
		}

		case 'boolean':
			return String(value);

		case 'number':
			return value;

		default:
			return '';
	}
}

type CompiledConfigWithBluePrints = CompiledConfig & {
	blueprints: Record<FieldsType, FieldsComponents>;
};

// Main build function
const generateBrowserConfig = (config: CompiledConfigWithBluePrints) => {
	const content = buildConfigString(config);

	if (cache.get('config.browser') !== content) {
		cache.set('config.browser', content);
		const browserConfigPath = path.resolve(process.cwd(), './src/lib/rizom.config.browser.js');
		fs.writeFileSync(browserConfigPath, content);
		taskLogger.done('Browser config built');
	}
};

// Build the final config content
export function buildConfigString(config: CompiledConfigWithBluePrints) {
	const configString = Object.entries(config)
		.filter(([key, value]) => shouldIncludeInBrowser(key, value))
		.map(([key, value]) => `${key}: ${parseValue(key, value)}`)
		.join(',');

	const functionDefinitions = Array.from(functionRegistry.entries())
		.map(([name, func]) => `const ${name} = ${func};`)
		.join('\n');

	const importDefinitions = Array.from(importRegistry.entries())
		.map(([name, path]) => `import ${name} from ${path};`)
		.join('\n');

	const packageName = 'rizom';
	const imports = [
		`import { validate } from '${packageName}/utils'`,
		`import { access } from '${packageName}/utils'`,
		hasEnv ? "import { env } from '$env/dynamic/public'" : ''
	]
		.filter(Boolean)
		.join('\n');

	return `${imports}
${importDefinitions}

${functionDefinitions}

/**
 * @type {import('${packageName}').BrowserConfig}
 */
const config = {${configString}};
export default config`.trim();
}

// Helper to get filename from Symbol
function getSymbolFilename(value: object): string | null {
	const symbols = Object.getOwnPropertySymbols(value);
	const filenameSymbol = symbols.find((sym) => sym.description === 'filename');
	if (filenameSymbol) {
		const descriptor = Object.getOwnPropertyDescriptor(value, filenameSymbol);
		return descriptor?.value ?? null;
	}
	return null;
}

export default generateBrowserConfig;
