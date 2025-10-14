import { existsSync } from 'fs';
import path from 'path';
import readline from 'readline';
import { INPUT_DIR, OUTPUT_DIR } from '../constants.js';

const root = process.cwd();

/**
 * Ensure sanitize config exists
 */
export function ensureGeneratedConfigExists() {
	const configGeneratedPath = path.resolve(root, 'src/lib', OUTPUT_DIR, 'rime.config.server.ts');
	if (!existsSync(configGeneratedPath)) {
		throw new Error('Unable to find generated config');
	}
	return path.join('$lib', OUTPUT_DIR, 'rime.config.server.js');
}

/**
 * Check for user configuration file at src/lib/config/rime.config.ts
 */
export function ensureUserConfigExists() {
	const configPath = path.resolve(root, 'src/lib', INPUT_DIR, 'rime.config.ts');

	if (!existsSync(configPath)) {
		throw new Error('Unable to find config, did you run rime init');
	}
}

/**
 * Check for user configuration file at src/lib/config/rime.config.ts
 */
export function ensureSchemaExists() {
	const schemaPath = path.resolve(root, 'src/lib', OUTPUT_DIR, 'schema.server.ts');

	if (!existsSync(schemaPath)) {
		throw new Error('Unable to find schema, did you run rime init');
	}
}

export const ensureHasInit = () => {
	const projectRoot = process.cwd();

	// Define file paths to check
	const envFile = path.resolve(projectRoot, './.env');
	const drizzleConfigFile = path.resolve(projectRoot, './drizzle.config.ts');
	const hooksServerFile = path.resolve(projectRoot, './src/hooks.server.ts');
	const dbDir = path.resolve(projectRoot, './db');

	// Check each file/directory and log warnings for missing ones
	const hasEnvFile = existsSync(envFile);
	if (!hasEnvFile) throw new Error('Missing .env file');

	const hasDrizzleConfig = existsSync(drizzleConfigFile);
	if (!hasDrizzleConfig) throw new Error('Missing drizzle.config.ts file');

	const hasHooksServer = existsSync(hooksServerFile);
	if (!hasHooksServer) throw new Error('Missing src/hooks.server.ts file');

	const hasDbDir = existsSync(dbDir);
	if (!hasDbDir) throw new Error('Missing db directory');

	ensureUserConfigExists();
	ensureGeneratedConfigExists();
	ensureSchemaExists();
};

/**
 * Simple function to ask a question and get user input
 */
export function prompt(query: string, defaultValue: string): Promise<string> {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});

	return new Promise((resolve) => {
		rl.question(`${query} (default: ${defaultValue}): `, (answer) => {
			rl.close();
			resolve(answer || defaultValue);
		});
	});
}
