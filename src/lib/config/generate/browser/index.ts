import fs from 'fs';
import path from 'path';
import { taskLogger } from 'rizom/utils/logger/index.js';
import cache from 'rizom/config/generate/cache/index.js';
import type { BuiltConfig, CompiledConfig } from 'rizom/types/config.js';
import { privateFieldNames } from 'rizom/collection/auth/privateFields.server';
import { PACKAGE_NAME } from 'rizom/constant';
import type { FieldsComponents } from 'rizom/types/panel';
import type { FieldsType } from 'rizom/types';

let hasEnv = false;

// Determines what should be included in browser config
function shouldIncludeInBrowser(key: string, value: any): boolean {
	// Exclude these keys entirely
	if (['cors', 'panel', 'smtp', 'routes', 'plugins', 'toSchema', 'toType', 'hooks'].includes(key))
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
	// Handle Svelte components from src
	if (path.endsWith('.svelte') && !path.includes('node_modules')) {
		const componentPath = path.split('src/').pop() ?? '';
		return `await import('../${componentPath}').then(m => m.default)`;
	}
	if (path.match(/rizom\/dist\/fields\/(.+?)\/component\/(.+?)\.svelte/)) {
		const modulePath = path.split('node_modules/').pop() ?? '';
		return modulePath.replace(
			/rizom\/dist\/fields\/(.+?)\/component\/(.+?)\.svelte/,
			`await import('${PACKAGE_NAME}/fields/components').then(m => m.$2)`
		);
	}
	// Handle node_modules imports
	if (path.includes('node_modules')) {
		const modulePath = path.split('node_modules/').pop() ?? '';
		return `await import('${modulePath
			.replace('dist/', '')
			.replace('.svelte', '')}').then(m => m.default)`;
	}

	return path;
}

function cleanViteImports(str: string) {
	return str.replace(/__vite_ssr_import_\d+__\.(access|validate)/g, '$1');
}

// Parse different value types
function parseValue(key: string, value: any): string | boolean | number {
	if (!shouldIncludeInBrowser(key, value)) return '';

	// Handle different value types
	switch (typeof value) {
		case 'function': {
			const filename = (value as any).filename || getSymbolFilename(value);
			if (filename) return createImportStatement(filename);

			let funcString = value.toString();
			// Handle environment variables
			const processEnvReg = /process\.env\.PUBLIC_([A-Z_]+)/gm;
			if (processEnvReg.test(funcString)) {
				hasEnv = true;
				funcString = funcString.replace(
					processEnvReg,
					(_: string, p1: string) => `env.PUBLIC_${p1}`
				);
			}
			return cleanViteImports(funcString);
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

type BuiltConfigWithBluePrints = CompiledConfig & {
	blueprints: Record<FieldsType, FieldsComponents>;
};

// Main build function
const generateBrowserConfig = (config: BuiltConfigWithBluePrints) => {
	const content = buildConfigString(config);

	if (cache.get('config.browser') !== content) {
		cache.set('config.browser', content);
		const browserConfigPath = path.resolve(process.cwd(), './src/lib/rizom.config.browser.js');
		fs.writeFileSync(browserConfigPath, content);
		taskLogger.done('Browser config built');
	}
};

// Build the final config content
export function buildConfigString(config: BuiltConfig) {
	const configString = Object.entries(config)
		.filter(([key, value]) => shouldIncludeInBrowser(key, value))
		.map(([key, value]) => `${key}: ${parseValue(key, value)}`)
		.join(',');

	const packageName = 'rizom';
	const imports = [
		`import { validate } from '${packageName}/utils'`,
		`import { access } from '${packageName}/utils'`,
		hasEnv ? "import { env } from '$env/dynamic/public'" : ''
	]
		.filter(Boolean)
		.join('\n');

	return `${imports}

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
