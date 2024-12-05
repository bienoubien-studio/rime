import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import * as templates from './templates.js';
import { intro, outro, select, text, log, spinner, isCancel } from '@clack/prompts';
import { getPackageInfoByKey } from './getPackageName.js';
import { random } from 'rizom/utils/index.js';
import cache from '../cache/index.js';
import { RizomInitError } from 'rizom/errors/init.server.js';
import {
	getInstallCommand,
	getPackageManager,
	type PackageManagerName
} from './packageManagerUtil.js';
import { execSync } from 'child_process';

type Args = {
	force?: boolean;
	skipInstall?: boolean;
	name?: string;
};

type EnvVarConfig = {
	value: string;
	replace: boolean; // if true, replace existing value; if false, keep existing value
};

const PACKAGE = 'rizom';

export const init = async ({ force, skipInstall, name: incomingName }: Args) => {
	cache.clear();
	const projectRoot = process.cwd();
	const packageName = getPackageInfoByKey('name');

	function setEnv() {
		const envPath = path.resolve(projectRoot, '.env');

		// Define variables with their update behavior
		const envUpdates: Record<string, EnvVarConfig> = {
			RIZOM_SECRET: {
				value: random.randomId(32),
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

	function setConfig() {
		const configDirPath = path.join(process.cwd(), 'src', 'config');
		const configPath = path.join(configDirPath, 'rizom.config.ts');

		if (!existsSync(configPath)) {
			if (!existsSync(configDirPath)) {
				mkdirSync(configDirPath);
			}
			writeFileSync(configPath, templates.emptyConfig);
		}
		log.info('Empty rizom.config.ts created');
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
			writeFileSync(schemaPath, templates.emptySchema);
		}
		log.info('Empty schema added');
	}

	function configureVite() {
		const configPath = path.resolve(projectRoot, 'vite.config.ts');
		if (!existsSync(configPath)) {
			throw new RizomInitError("Can't find vite configuration file");
		}
		const content = readFileSync(configPath, 'utf-8');
		if (!content.includes('rizom()')) {
			// Add import
			const newContent = content.replace(
				/(import .* from .*;\n?)/,
				`$1import { rizom } from '${PACKAGE}/vite';\n`
			);

			// Add plugin to the list
			const updatedContent = newContent.replace(
				/plugins:\s*\[([\s\S]*?)\]/,
				(match, plugins) => `plugins: [rizom(), ${plugins}]`
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

	async function installDeps(force = false) {
		const devDeps = ['drizzle-kit@0.22.8'];
		if (force) {
			const packageManager = getPackageManager();
			const command = getInstallCommand(packageManager);
			execSync(`${command} -D ${devDeps.join(' ')}`);
			log.info('drizzle-kit installed');
		} else {
			const packageManager = await select({
				message: 'Which package manager do you want to install dependencies (drizzle-kit) with?',
				options: [
					{ value: 'npm', label: 'npm' },
					{ value: 'pnpm', label: 'pnpm' },
					{ value: 'yarn', label: 'yarn', hint: 'not tested' },
					{ value: 'bun', label: 'bun', hint: 'not tested' }
				]
			});
			if (isCancel(packageManager)) {
				outro('Operation cancelled');
				process.exit(0);
			}
			const isValidPackageManager = (name: unknown): name is PackageManagerName =>
				typeof packageManager === 'string' &&
				['pnpm', 'npm', 'yarn', 'bun'].includes(packageManager);
			if (!isValidPackageManager(packageManager)) return;
			const s = spinner();
			s.start('Installing via ' + packageManager);
			const command = getInstallCommand(packageManager);
			execSync(`${command} -D ${devDeps.join(' ')}`);
			s.stop('drizzle-kit installed');
		}
	}

	if (force || incomingName) {
		const name = incomingName || packageName;
		setEnv();
		setConfig();
		setDatabase();
		setDrizzle(name);
		setSchema();
		setHooks();
		configureVite();
		if (!skipInstall) {
			await installDeps(true);
		}
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
		setConfig();
		setDatabase();
		setDrizzle(name);
		setSchema();
		setHooks();
		configureVite();
		if (!skipInstall) {
			await installDeps();
		}
		outro('done !');
	}
};
