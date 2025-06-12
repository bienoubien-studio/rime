import { logger } from '../../logger/index.server.js';
import { existsSync } from 'fs';
import path from 'path';

export const hasRunInitCommand = () => {
	const projectRoot = process.cwd();

	// Define file paths to check
	const envFile = path.resolve(projectRoot, './.env');
	const drizzleConfigFile = path.resolve(projectRoot, './drizzle.config.ts');
	const schemaFile = path.resolve(projectRoot, './src/lib/server/schema.ts');
	const hooksServerFile = path.resolve(projectRoot, './src/hooks.server.ts');
	const dbDir = path.resolve(projectRoot, './db');
	const configDir = path.resolve(projectRoot, './src/config');
	const rizomConfigFile = path.resolve(configDir, './rizom.config.ts');

	// Check each file/directory and log warnings for missing ones
	const hasEnvFile = existsSync(envFile);
	if (!hasEnvFile) logger.warn('Missing .env file');

	const hasDrizzleConfig = existsSync(drizzleConfigFile);
	if (!hasDrizzleConfig) logger.warn('Missing drizzle.config.ts file');

	const hasSchemaFile = existsSync(schemaFile);
	if (!hasSchemaFile) logger.warn('Missing src/lib/server/schema.ts file');

	const hasHooksServer = existsSync(hooksServerFile);
	if (!hasHooksServer) logger.warn('Missing src/hooks.server.ts file');

	const hasDbDir = existsSync(dbDir);
	if (!hasDbDir) logger.warn('Missing db directory');

	const hasConfigDir = existsSync(configDir);
	if (!hasConfigDir) logger.warn('Missing src/config directory');

	const hasRizomConfig = existsSync(rizomConfigFile);
	if (!hasRizomConfig) logger.warn('Missing src/config/rizom.config.ts file');

	// Return combined result
	return (
		hasEnvFile && hasDrizzleConfig && hasSchemaFile && hasHooksServer && hasDbDir && hasConfigDir && hasRizomConfig
	);
};
