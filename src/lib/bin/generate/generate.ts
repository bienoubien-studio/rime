import path from 'path';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { buildConfig } from 'rizom/config/build/index.js';

export const generate = async (force?: boolean) => {
	const pathToSchema = path.join(process.cwd(), 'src', 'lib', 'server', 'schema.ts');
	if (!existsSync(pathToSchema)) {
		throw new Error('No schema found run rizom init');
	}

	if (force) {
		try {
			rmSync(path.join(process.cwd(), '.rizom'), { recursive: true });
			mkdirSync(path.join(process.cwd(), '.rizom'));
		} catch (err: any) {
			console.error(err.message);
		}
		try {
			rmSync(path.join(process.cwd(), 'src', 'routes', '(rizom)'), { recursive: true });
		} catch (err: any) {
			console.error(err.message);
		}
	}

	const configPath = path.join(process.cwd(), 'src', 'config', 'rizom.config.ts');
	const configPathJS = path.join(process.cwd(), 'src', 'config', 'rizom.config.js');

	if (!existsSync(configPath)) {
		throw new Error('Unable to find config, did you run rizom init');
	}

	await import(configPathJS)
		.then((module) => module.default)
		.then(async (config) => await buildConfig(config, { generateFiles: true }));
};
