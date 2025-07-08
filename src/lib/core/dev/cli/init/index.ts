import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import * as templates from './templates.js';
import { getPackageInfoByKey } from './getPackageName.js';
import { randomId } from '$lib/util/random.js';
import { fileURLToPath } from 'url';
import { cp, mkdir } from 'fs/promises';
import { generate } from '../generate/index.js';
import { logger } from '$lib/core/logger/index.server.js';
import { prompt } from '../util.server.js';

type Args = {
	force?: boolean;
	name?: string;
};

type EnvVarConfig = {
	value: string;
	replace: boolean; // if true, replace existing value; if false, keep existing value
};

const PACKAGE = 'rizom';

export const init = async ({ force, name: incomingName }: Args) => {
	const projectRoot = process.cwd();
	const packageName = getPackageInfoByKey('name');

	function setEnv() {
		const envPath = path.resolve(projectRoot, '.env');

		// Define variables with their update behavior
		const envUpdates: Record<string, EnvVarConfig> = {
			BETTER_AUTH_SECRET: {
				value: randomId(32),
				replace: false // won't replace if already exists
			}
		};

		if (existsSync(envPath)) {
			let envContent = readFileSync(envPath, 'utf-8');

			Object.entries(envUpdates).forEach(([key, config]) => {
				const exists = envContent.match(new RegExp(`^${key}=`, 'm'));

				if (exists) {
					if (config.replace) {
						envContent = envContent.replace(new RegExp(`^${key}=.*`, 'm'), `${key}=${config.value}`);
					}
				} else {
					// Add new value if doesn't exist
					envContent += `\n${key}=${config.value}`;
				}
			});

			writeFileSync(envPath, envContent);
			logger.info('[✓] .env file populated');
		} else {
			writeFileSync(envPath, templates.env());
			logger.info('[✓] .env file created');
		}
	}

	function setConfig(name: string) {
		const configDirPath = path.join(process.cwd(), 'src', 'config');
		const configPath = path.join(configDirPath, 'rizom.config.ts');

		if (!existsSync(configPath)) {
			if (!existsSync(configDirPath)) {
				mkdirSync(configDirPath);
			}
			writeFileSync(configPath, templates.defaultConfig(name.toString()));
		}
		logger.info('[✓] Created src/config/rizom.config.ts');
	}

	function setDatabase() {
		const dbPath = path.join(process.cwd(), 'db');
		if (!existsSync(dbPath)) {
			mkdirSync(dbPath);
		}
		logger.info('[✓] Created db folder');
	}

	function setDrizzle(name: string) {
		const drizzleConfigPath = path.join(process.cwd(), 'drizzle.config.ts');
		if (!existsSync(drizzleConfigPath)) {
			writeFileSync(drizzleConfigPath, templates.drizzleConfig(name.toString()));
		}
		logger.info('[✓] Added Drizzle config');
	}

	function configureVite() {
		const configPath = path.resolve(projectRoot, 'vite.config.ts');
		if (!existsSync(configPath)) {
			throw new Error("Can't find vite configuration file");
		}
		const content = readFileSync(configPath, 'utf-8');
		if (!content.includes('rizom()')) {
			// Add import
			const newContent = content.replace(/(import .* from .*;\n?)/, `$1import { rizom } from '${PACKAGE}/vite';\n`);

			// Add plugin to the list - ensure it's after sveltekit()
			const updatedContent = newContent.replace(/plugins:\s*\[([\s\S]*?)\]/, (match, plugins) => {
				// Check if sveltekit() is in the plugins list
				if (plugins.includes('sveltekit()')) {
					// Add rizom() after sveltekit()
					return plugins.includes('sveltekit()')
						? match.replace('sveltekit()', 'sveltekit(), rizom()')
						: `plugins: [${plugins}, rizom()]`;
				} else {
					// If sveltekit() isn't found, add rizom() at the end
					return `plugins: [${plugins}, rizom()]`;
				}
			});
			writeFileSync(configPath, updatedContent);
		}
		logger.info('[✓] Added Vite plugin');
	}

	function setHooks() {
		const hooksPath = path.join(projectRoot, 'src', 'hooks.server.ts');
		const srcDir = path.join(projectRoot, 'src');

		// Check if file exists
		if (!existsSync(hooksPath)) {
			// Ensure src directory exists
			if (!existsSync(srcDir)) {
				mkdirSync(srcDir, { recursive: true });
			}
			// Create hooks.server.ts with template content
			writeFileSync(hooksPath, templates.hooks, 'utf-8');
			logger.info('[✓] Created src/hooks.server.ts');
		} else {
			logger.warn('hooks.server.ts already exists (skip)');
		}
	}

	// async function installDeps(force = false) {
	// 	const devDeps = ['drizzle-kit'];
	// 	const deps = ['better-sqlite3', 'sharp'];
	// 	if (force) {
	// 		const packageManager = getPackageManager();
	// 		const command = getInstallCommand(packageManager);
	// 		execSync(`${command} -D ${devDeps.join(' ')} && ${command} ${deps.join(' ')}`);
	// 		logger.info('drizzle-kit & better-sqlite3 installed');
	// 	} else {
	// 		const packageManager = await select({
	// 			message: 'Which package manager do you want to install dependencies with?',
	// 			options: [
	// 				{ value: 'npm', label: 'npm' },
	// 				{ value: 'pnpm', label: 'pnpm' },
	// 				{ value: 'yarn', label: 'yarn', hint: 'not tested' },
	// 				{ value: 'bun', label: 'bun', hint: 'not tested' }
	// 			]
	// 		});
	// 		if (isCancel(packageManager)) {
	// 			outro('Operation cancelled');
	// 			process.exit(0);
	// 		}
	// 		const isValidPackageManager = (name: unknown): name is PackageManagerName =>
	// 			typeof packageManager === 'string' &&
	// 			['pnpm', 'npm', 'yarn', 'bun'].includes(packageManager);
	// 		if (!isValidPackageManager(packageManager)) return;
	// 		const s = spinner();
	// 		s.start('Installing via ' + packageManager);
	// 		const command = getInstallCommand(packageManager);
	// 		execSync(`${command} -D ${devDeps.join(' ')} && ${command} ${deps.join(' ')}`);
	// 		s.stop('drizzle-kit & better-sqlite3 installed');
	// 		s.start('Pushing schema');
	// 		execSync(`npx drizzle-kit push`);
	// 		s.stop('Schema pushed');
	// 	}
	// }

	async function copyAssets() {
		try {
			const currentDir = path.dirname(fileURLToPath(import.meta.url));
			await mkdir(path.resolve(process.cwd(), 'static/panel/fonts'), { recursive: true });
			await cp(path.join(currentDir, '../../../../panel/fonts'), path.resolve(process.cwd(), 'static/panel/fonts'), {
				recursive: true
			});
			logger.info('[✓] Copied assets');
		} catch (err) {
			console.error('[!] Error copying fonts:', err);
		}
	}

	if (force || incomingName) {
		const name = incomingName || packageName;
		setEnv();
		setConfig(name);
		setDatabase();
		setDrizzle(name);
		setHooks();
		configureVite();
		await copyAssets();
		await generate({ force: true });
		// if (!skipInstall) {
		// 	await installDeps(true);
		// }
	} else {
		const name = await prompt('What is your project name (will be used as database name) ?', packageName || 'app');
		
		if (!name) {
			logger.error('Operation cancelled');
			process.exit(0);
		}

		setEnv();
		setConfig(name);
		setDatabase();
		setDrizzle(name);
		setHooks();
		configureVite();
		await copyAssets();
		await generate({ force: true });
		// if (!skipInstall) {
		// 	await installDeps();
		// }
		logger.info('[✓] done');
	}
};
