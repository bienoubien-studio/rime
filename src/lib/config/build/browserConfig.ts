import fs from 'fs';
import path from 'path';
import { taskLogger } from '../../logger/index.js';
import cache from '../../bin/cache/index.js';
import { privateFieldNames } from '../../auth/usersConfig.server.js';
import type { BuiltConfig } from 'rizom/types/config.js';

let hasEnv = false;

const resolveModule = (path: string) => {
	console.log(path);
	if (path.endsWith('.svelte') && !path.includes('node_modules')) return resolveComponent(path);
	const compPath = path.split('node_modules/').pop() ?? '';
	return `await import('${compPath.replace('dist/', '').replace('.svelte', '')}').then(module => module.default)`;
};

const resolveComponent = (path: string) => {
	const componentPath = path.split('src/').pop() ?? '';
	return `await import('../${componentPath}').then(module => module.default)`;
};

const parseArray = (value: any[]): string => {
	return `[${value
		.map((item) => parseValue('', item))
		.filter(Boolean)
		.join(',')}]`;
};

function cleanViteImports(str: string) {
	const regex = /__vite_ssr_import_\d+__\.(access|validate)/g;
	return str.replace(regex, (_, p1) => p1);
}

const parseFunctionValue = (value: (...args: any[]) => any): string => {
	const filename = (value as any).filename || getSymbolFilename(value);
	if (filename) return resolveModule(filename);

	let funcString = value.toString();
	const processEnvReg = /process\.env\.PUBLIC_([A-Z_]+)/gm;
	if (processEnvReg.test(funcString)) {
		hasEnv = true;
		funcString = funcString.replace(processEnvReg, (_, p1) => `env.PUBLIC_${p1}`);
	}

	return cleanViteImports(funcString);
};

const parseObjectValue = (key: string, value: object): string | boolean => {
	if ('name' in value && 'type' in value && privateFieldNames.includes(value['name'] as string)) {
		return false;
	}
	const entries = Object.entries(value)
		.filter(([k]) => !['hooks', 'server'].includes(k))
		.map(([k, v]) => `'${k}': ${parseValue(k, v)}`);
	return `{${entries.join(',')}}`;
};

const parseStringValue = (key: string, value: string): string => {
	if (value.includes('node_modules')) return resolveModule(value);
	if (value.endsWith('.svelte')) return resolveComponent(value);
	return JSON.stringify(value);
};

const parseValue = (key: string, value: any): string | boolean | number => {
	if (['toSchema', 'toType'].includes(key)) return 'null';
	if (key === 'component') {
		console.log(typeof value);
	}
	if (Array.isArray(value)) return parseArray(value);
	if (typeof value === 'function') return parseFunctionValue(value);
	if (typeof value === 'object') return parseObjectValue(key, value);
	if (typeof value === 'boolean') return `${value}`;
	if (typeof value === 'number') return value;
	if (typeof value === 'string') return parseStringValue(key, value);
	return '';
};

const buildBrowserConfig = (config: BuiltConfig) => {
	const configString = Object.entries(config)
		.filter(([key]) => !['cors', 'panel', 'smtp', 'routes', 'plugins'].includes(key))
		.map(([key, value]) => `${key}: ${parseValue(key, value)}`)
		.join(',');

	const content = buildConfigContent(configString);

	if (cache.get('config.browser') !== content) {
		cache.set('config.browser', content);
		const browserConfigPath = path.resolve(process.cwd(), './src/lib/rizom.config.browser.js');
		fs.writeFileSync(browserConfigPath, content);
		taskLogger.done('Browser config built');
	}
};

function buildConfigContent(sanitizedConfig: string) {
	const packageName = 'rizom';
	const validateAccessImports = `import { validate } from '${packageName}/utils'\nimport { access } from '${packageName}/access'`;
	const envImport = hasEnv ? "import { env } from '$env/dynamic/public'" : '';
	return `${validateAccessImports}
${envImport}
/**
 * @type {import('${packageName}').BrowserConfig}
 */
const config = {${sanitizedConfig}};
export default config
    `.trim();
}

function getSymbolFilename(value: object): string | null {
	const symbols = Object.getOwnPropertySymbols(value);
	const filenameSymbol = symbols.find((sym) => sym.description === 'filename');
	if (filenameSymbol) {
		const descriptor = Object.getOwnPropertyDescriptor(value, filenameSymbol);
		return descriptor?.value ?? null;
	}
	return null;
}

export default buildBrowserConfig;
