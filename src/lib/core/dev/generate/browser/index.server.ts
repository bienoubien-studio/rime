import type { CompiledConfig } from '$lib/core/config/types/index.js';
import * as CONSTANTS from '$lib/core/constant.js';
import { RizomFormError } from '$lib/core/errors/index.js';
import { logger } from '$lib/core/logger/index.server.js';
import type { FieldsComponents } from '$lib/panel/types.js';
import cache from '../../cache/index.js';

import { PRIVATE_FIELDS } from '$lib/core/collections/auth/constant.server.js';
import {
	normalizeFilePath,
	normalizePnpmPath,
	normalizeRizomImport,
	removeLeadingSlash
} from './normalize-path.server.js';

let functionRegistry = new Map<string, string>();
let importRegistry = new Map<string, string>();
let hasEnv = false;
let needsValidate = false;
let needsAccess = false;
let functionCounter = 0;
let importCounter = 0;

// Determines what should be included in browser config
function shouldIncludeInBrowser(key: string, value: any, parentKey: string = ''): boolean {
	const fullPath = parentKey ? `${parentKey}.${key}` : key;

	// Patterns to exclude - more flexible matching
	const excludePatterns = [
		// Root level exclusions
		'^trustedOrigins$',
		'^database$',
		'^smtp$',
		'^routes$',
		'^plugins$',
		'^cache',

		// Exclude critical panel properties
		'^panel.access',
		'^panel.routes',
		'^panel.users',

		// Exclude area and collection hooks
		'^collections..hooks',
		'^areas..hooks',

		// exclude fields hooks (allow client hook : fields..hooks.onChange)
		'fields..hooks.beforeValidate',
		'fields..hooks.beforeSave',
		'fields..hooks.beforeRead',

		// Generic patterns
		'.*.server' // Exclude any path ending with server
	];

	// Check if path matches any exclude pattern
	if (excludePatterns.some((pattern) => new RegExp(pattern).test(fullPath))) {
		return false;
	}

	// Rest of existing checks for objects
	if (typeof value === 'object' && value !== null) {
		if ('name' in value && 'type' in value) {
			if (PRIVATE_FIELDS.includes(value.name)) {
				return false;
			}
		}
	}

	return true;
}

// Handles import paths for components and modules
function createImportStatement(pathInfo: string | { path: string; exportName: string }): string {
	let importPath: string;

	let exportName: string | undefined;

	// Handle external module object format
	if (typeof pathInfo === 'object') {
		importPath = pathInfo.path;
		exportName = pathInfo.exportName;
	} else {
		importPath = pathInfo;
	}

	importPath = normalizePnpmPath(importPath);
	importPath = normalizeFilePath(importPath);
	importPath = removeLeadingSlash(importPath);
	importPath = normalizeRizomImport(importPath);
	if (!importPath.startsWith('rizom') && !importPath.startsWith('@rizom')) {
		importPath = `./${importPath}`;
	}

	// Quoting
	importPath = `'${importPath}'`;

	const importName = `import_${importCounter++}`;

	// Register the import with appropriate format based on exportName
	if (exportName && exportName !== 'default') {
		importRegistry.set(importName, `import { ${exportName} as ${importName} } from ${importPath}`);
	} else {
		importRegistry.set(importName, `import ${importName} from ${importPath}`);
	}

	return importName;
}

function cleanViteImports(str: string) {
	// Replace RizomFormError.CONSTANT with it's value
	str = str.replace(/__vite_ssr_import_\d+__\.RizomFormError\.([A-Z_]+)/g, (_, key) =>
		JSON.stringify(RizomFormError[key as keyof typeof RizomFormError])
	);
	// replace with access and validate built-in modules
	str.match(/__vite_ssr_import_\d+__\.(access|validate)/g)?.forEach((match) => {
		if (match.endsWith('.access')) needsAccess = true;
		if (match.endsWith('.validate')) needsValidate = true;
	});

	// replace constants with property access
	const constantsRegExp = new RegExp(`__vite_ssr_import_\\d+__\\.(${Object.keys(CONSTANTS).join('|')}).(\\w+)`, 'g');
	str = str.replace(constantsRegExp, (_, constantKey, propertyKey) => {
		const constantValue = CONSTANTS[constantKey as keyof typeof CONSTANTS];
		if (constantValue && typeof constantValue === 'object' && propertyKey in constantValue) {
			return JSON.stringify(constantValue[propertyKey as keyof typeof constantValue]);
		}
		return _; // Return original if property not found
	});
	
	// replace constants without property access
	const regExp = new RegExp(`__vite_ssr_import_\\d+__\\.(${Object.keys(CONSTANTS).join('|')})`, 'g');
	str = str.replace(regExp, (_, key) => JSON.stringify(CONSTANTS[key as keyof typeof CONSTANTS]));

	if (str.includes('validate.')) {
		needsValidate = true;
	}

	// Replace __vite_ssr_import_0__.(validate|access)
	str = str.replace(/__vite_ssr_import_\d+__\.(access|validate)/g, '$1');

	return str;
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

function isExternalModule(value: any): { path: string; exportName: string } | null {
	const externalSymbol = Symbol.for('external');
	// Check if value is an object (including functions)
	if (value !== null && (typeof value === 'object' || typeof value === 'function')) {
		if (externalSymbol in value) {
			return value[externalSymbol];
		}
	}
	return null;
}

// Parse different value types
function parseValue(key: string, value: any, parentKey: string = ''): string | boolean | number {
	if (!shouldIncludeInBrowser(key, value, parentKey)) return '';

	// Check for external module first
	const externalPath = isExternalModule(value);
	if (externalPath) {
		return createImportStatement(externalPath);
	}

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
					.map((item) => parseValue('', item, key))
					.filter(Boolean)
					.join(',')}]`;
			}
			// Handle objects
			const fullPath = parentKey ? `${parentKey}.${key}` : key;
			const entries = Object.entries(value)
				.filter(([k, v]) => shouldIncludeInBrowser(k, v, fullPath))
				.map(([k, v]) => `'${k}': ${parseValue(k, v, fullPath)}`);
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
			return 'null';
	}
}

type CompiledConfigWithBluePrints = CompiledConfig & {
	blueprints: Record<string, FieldsComponents>;
};

// Main build function
const generateBrowserConfig = (config: CompiledConfigWithBluePrints) => {
	const content = buildConfigString(config);
	if(content.includes('__vite_ssr_import')){
		cache.delete('config')
		console.log(content)
		throw new Error('Unhandled module __vite_ssr_import_d+__')
	}
	if (cache.get('config.browser') !== content) {
		cache.set('config.browser', content);
		logger.info('[✓] Browser config built');
	}
};

// Build the final config content
export function buildConfigString(config: CompiledConfigWithBluePrints) {
	// Reset vars
	functionRegistry = new Map<string, string>();
	importRegistry = new Map<string, string>();
	hasEnv = false;
	needsValidate = false;
	needsAccess = false;
	functionCounter = 0;
	importCounter = 0;

	const configString = Object.entries(config)
		.filter(([key, value]) => shouldIncludeInBrowser(key, value))
		.map(([key, value]) => `${key}: ${parseValue(key, value)}`)
		.join(',');

	const functionDefinitions = Array.from(functionRegistry.entries())
		.map(([name, func]) => `const ${name} = ${func};`)
		.join('\n');

	const importDefinitions = Array.from(importRegistry.values()).join('\n');

	const packageName = 'rizom';
	const imports = [
		needsValidate ? `import { validate } from '${packageName}/util'` : '',
		needsAccess ? `import { access } from '${packageName}/util'` : '',
		hasEnv ? "import { env } from '$env/dynamic/public'" : ''
	]
		.filter(Boolean)
		.join('\n');

	return `// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
${imports}
${importDefinitions}

${functionDefinitions}

/**
 * @type {import('${packageName}/types').BrowserConfig}
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
