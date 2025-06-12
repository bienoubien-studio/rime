import path from 'path';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { logger } from '$lib/core/logger/index.server.js';

export const generate = async (force?: boolean) => {
	if (force) {
		try {
			rmSync(path.join(process.cwd(), '.rizom'), { recursive: true, force: true });
			mkdirSync(path.join(process.cwd(), '.rizom'));
		} catch (err: any) {
			logger.error(err.message);
		}
		try {
			rmSync(path.join(process.cwd(), 'src', 'routes', '(rizom)'), { recursive: true, force: true });
		} catch (err: any) {
			logger.error(err.message);
		}
	}

	const configPath = path.join(process.cwd(), 'src', 'config', 'rizom.config.ts');
	const configPathJS = path.join(process.cwd(), 'src', 'config', 'rizom.config.js');

	if (!existsSync(configPath)) {
		throw new Error('Unable to find config, did you run rizom init');
	}

	try {
		// Use Vite to load and process the config
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

		try {
			// Use Vite's SSR capabilities to load the module
			logger.info('Loading config from:', configPathJS);

			const buildModule = await vite.ssrLoadModule('rizom/core/config/build/index.js');
			const configModule = await vite.ssrLoadModule(configPathJS);
			const config = configModule.default;

			// Build the config
			await buildModule.buildConfig(config, { generateFiles: true });

			logger.info('Generation completed successfully');
		} finally {
			// Always close the Vite server
			await vite.close();
		}
	} catch (error) {
		logger.error('Error during generation:', error);
		if (error instanceof Error) {
			logger.error(error.stack);
		}
		throw error;
	}
};
