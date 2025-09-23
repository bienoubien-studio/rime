import { logger } from '$lib/core/logger/index.server.js';
import { trycatch } from '$lib/util/function.js';
import { existsSync, mkdirSync, rmSync } from 'fs';
import path from 'path';
import cache from '../../cache';
import { sanitize } from '../../generate/sanitize';

export const generate = async (args: { force?: boolean }) => {
	const { force } = args;

	/**
	 * Clear the cached .rizom folder
	 */
	function clearConfigCache() {
		try {
			rmSync(path.join(process.cwd(), '.rizom'), { recursive: true, force: true });
			mkdirSync(path.join(process.cwd(), '.rizom'));
		} catch (err: any) {
			logger.error(err.message);
		}
	}

	/*
	 * Delete routes/(rizom) folder
	 */
	function clearRoutes() {
		try {
			rmSync(path.join(process.cwd(), 'src', 'routes', '(rizom)'), { recursive: true, force: true });
		} catch (err: any) {
			logger.error(err.message);
		}
	}

	/**
	 * Check for user configuration file at src/lib/config/rizom.config.ts
	 */
	function ensureUserConfigExists() {
		const configPath = path.join(process.cwd(), 'src', 'lib', 'config', 'rizom.config.ts');

		if (!existsSync(configPath)) {
			throw new Error('Unable to find config, did you run rizom init');
		}
	}

	/**
	 * Sanitize the user config and create the config.generated folder
	 */
	async function sanitizeConfig() {
		await sanitize();
	}

	/**
	 * Create the vite devServer
	 */
	async function createServer() {
		const { createServer } = await import('vite');

		// Create a Vite server using the project's vite.config.ts
		logger.info('Starting Vite server to handle module resolution...');
		const vite = await createServer({
			configFile: path.join(process.cwd(), 'vite.config.ts'),
			server: {
				hmr: false,
				middlewareMode: true
			},
			appType: 'custom',
			logLevel: 'error'
		});
		return vite;
	}

	/**
	 * Ensure sanitize config exists
	 */
	function ensureGeneratedConfigExists() {
		const configGeneratedPath = path.join(process.cwd(), 'src', 'lib', 'config.generated', 'rizom.config.server.ts');
		if (!existsSync(configGeneratedPath)) {
			throw new Error('Unable to find generated config');
		}
	}

	async function run() {
		if (force) {
			clearConfigCache();
			clearRoutes();
		}
		ensureUserConfigExists();
		await sanitizeConfig();
		ensureGeneratedConfigExists();
		const vite = await createServer();
		await vite.ssrLoadModule('rizom:config');

		while (cache.get('.generating')) {
			await new Promise((resolve) => setTimeout(resolve, 200));
		}

		await vite.close();
		logger.info('[✓] Generation completed successfully');
	}

	const [error] = await trycatch(run);

	if (error) {
		logger.error('Error during generation:', error);
		throw error;
	}
};
