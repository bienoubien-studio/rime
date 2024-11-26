import buildBrowserConfig from '../config/build/browserConfig.js';
import cache from './cache/index.js';
import generateRoutes from './routes/index.js';
import generateSchema from './schema/index.js';
import generateTypes from './types/index.js';
import path from 'path';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { buildConfig } from '../config/build/index.js';

export const generate = async (force?: boolean) => {
	const pathToSchema = path.resolve(process.cwd(), './src/lib/server/schema.ts');
	if (!existsSync(pathToSchema)) {
		throw new Error('pas de schema run init man...');
	}

	if (force) {
		try {
			rmSync(path.resolve(process.cwd(), './.rizom'), { recursive: true });
			mkdirSync(path.resolve(process.cwd(), './.rizom'));
		} catch (err: any) {
			console.log(err.message);
		}
		try {
			rmSync(path.resolve(process.cwd(), './src/routes/(rizom)'), { recursive: true });
		} catch (err: any) {
			console.log(err.message);
		}
	}

	if (!cache.get('error')) {
		const configPath = path.resolve(process.cwd(), './src/config/rizom.config.ts');
		const configPathJS = path.resolve(process.cwd(), './src/config/rizom.config.js');

		if (!existsSync(configPath)) {
			throw new Error('Unable to find config, did you run rizom init');
		}

		const config = await import(configPathJS)
			.then((module) => module.default)
			.then(async (config) => await buildConfig(config));

		buildBrowserConfig(config);
		generateSchema(config);
		generateRoutes(config);
		generateTypes(config);
	}
};
