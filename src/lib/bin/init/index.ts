import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import * as templates from './templates.js';
import { intro, outro, text, log, isCancel } from '@clack/prompts';
import { getPackageInfoByKey } from './getPackageName.js';
import { randomId } from '$lib/util/random.js';
import { fileURLToPath } from 'url';
import { cp, mkdir } from 'fs/promises';

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
						envContent = envContent.replace(
							new RegExp(`^${key}=.*`, 'm'),
							`${key}=${config.value}`
						);
					}
				} else {
					// Add new value if doesn't exist
					envContent += `\n${key}=${config.value}`;
				}
			});

			writeFileSync(envPath, envContent);
			log.info('.env file populated');
		} else {
			writeFileSync(envPath, templates.env());
			log.info('.env file created');
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
		log.info('rizom.config.ts created');
	}

	function setDatabase() {
		const dbPath = path.join(process.cwd(), 'db');
		if (!existsSync(dbPath)) {
			mkdirSync(dbPath);
		}
		log.info('Created db folder');
	}

	function setDrizzle(name: string) {
		const drizzleConfigPath = path.join(process.cwd(), 'drizzle.config.ts');
		if (!existsSync(drizzleConfigPath)) {
			writeFileSync(drizzleConfigPath, templates.drizzleConfig(name.toString()));
		}
		log.info('Drizzle config added');
	}

	function setSchema() {
		const schemaPath = path.join(process.cwd(), 'src', 'lib', 'server', 'schema.ts');
		if (!existsSync(schemaPath)) {
			const libServerPath = path.join(process.cwd(), 'src', 'lib', 'server');
			if (!existsSync(libServerPath)) {
				mkdirSync(libServerPath);
			}
			writeFileSync(schemaPath, templates.defaultSchema);
		}
		log.info('schema added');
	}

	function configureVite() {
		const configPath = path.resolve(projectRoot, 'vite.config.ts');
		if (!existsSync(configPath)) {
			throw new Error("Can't find vite configuration file");
		}
		const content = readFileSync(configPath, 'utf-8');
		if (!content.includes('rizom()')) {
			// Add import
			const newContent = content.replace(
				/(import .* from .*;\n?)/,
				`$1import { rizom } from '${PACKAGE}/vite';\n`
			);

			// Add plugin to the list - ensure it's after sveltekit()
			const updatedContent = newContent.replace(
				/plugins:\s*\[([\s\S]*?)\]/,
				(match, plugins) => {
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
				}
			);
			writeFileSync(configPath, updatedContent);
		}
		log.info('Vite plugin added');
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
			log.info('Created src/hooks.server.ts');
		} else {
			log.info('hooks.server.ts already exists');
		}
	}

	// async function installDeps(force = false) {
	// 	const devDeps = ['drizzle-kit'];
	// 	const deps = ['better-sqlite3', 'sharp'];
	// 	if (force) {
	// 		const packageManager = getPackageManager();
	// 		const command = getInstallCommand(packageManager);
	// 		execSync(`${command} -D ${devDeps.join(' ')} && ${command} ${deps.join(' ')}`);
	// 		log.info('drizzle-kit & better-sqlite3 installed');
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
			await cp(
				path.join(currentDir, '../../panel/fonts'),
				path.resolve(process.cwd(), 'static/panel/fonts'),
				{ recursive: true }
			);
			log.info('copied assets');
		} catch (err) {
			console.error('Error copying fonts:', err);
		}
	}
	
	if (force || incomingName) {
		const name = incomingName || packageName;
		setEnv();
		setConfig(name);
		setDatabase();
		setDrizzle(name);
		setSchema();

		setHooks();
		configureVite();
		copyAssets();
		// if (!skipInstall) {
		// 	await installDeps(true);
		// }
	} else {
		intro('This will setup configuration files and install dependencies');

		const name = (await text({
			message: 'What is your project name ? (It will be use as default database name)',
			placeholder: packageName,
			initialValue: packageName,
			validate(value) {
				const regex = /^[A-Za-z][A-Za-z0-9\-_]*$/;
				if (!regex.test(value)) {
					return 'Can only contains letters, underscores and hyphens.';
				}
			}
		})) as string;

		if (isCancel(name)) {
			outro('Operation cancelled');
			process.exit(0);
		}

		setEnv();
		setConfig(name);
		setDatabase();
		setDrizzle(name);
		setSchema();

		setHooks();
		configureVite();
		copyAssets();
		// if (!skipInstall) {
		// 	await installDeps();
		// }
		outro('done');
	}
};
