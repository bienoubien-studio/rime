import { logger } from '$lib/core/logger/index.server.js';
import { randomId } from '$lib/util/random.js';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { cp, mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { generate } from '../generate/index.js';
import { prompt } from '../util.server.js';
import { getPackageInfoByKey } from './getPackageName.js';
import { installDependencies } from './packageManagerUtil.js';
import * as templates from './templates.js';

type Args = {
	force?: boolean;
	name?: string;
};

const PACKAGE = '@bienbien/rime';

export const init = async ({ force, name: incomingName }: Args) => {
	const projectRoot = process.cwd();
	const packageName = getPackageInfoByKey('name');

	function setEnv() {
		const envPath = path.resolve(projectRoot, '.env');

		// Define variables with their update behavior
		const envUpdates: Record<string, string> = {
			BETTER_AUTH_SECRET: randomId(32),
			PUBLIC_RIME_URL: 'http://localhost:5173',
			'# RIME_SMTP_USER': 'user@mail.com',
			'# RIME_SMTP_PASSWORD': 'supersecret',
			'# RIME_SMTP_PORT': '465',
			'# RIME_SMTP_HOST': 'smtphost.com',
			RIME_LOG_LEVEL: 'TRACE',
			RIME_LOG_TO_FILE: 'true',
			RIME_LOG_TO_FILE_MAX_DAYS: '1'
		};

		if (existsSync(envPath)) {
			logger.info('[✓] .env file found');
			let envContent = readFileSync(envPath, 'utf-8');

			Object.entries(envUpdates).forEach(([key, value]) => {
				const exists = envContent.match(new RegExp(`^${key}=`, 'm'));

				if (exists) {
					// logger.info(`-> ${key} already defined (skip)`);
				} else {
					// Add new value if doesn't exist
					envContent += `\n${key}=${value}`;
					logger.info(`- ${key} added`);
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
		const configDirPath = path.join(process.cwd(), 'src', 'lib', 'config');
		const configPath = path.join(configDirPath, 'rime.config.ts');

		if (!existsSync(configPath)) {
			if (!existsSync(configDirPath)) {
				mkdirSync(configDirPath);
			}
			writeFileSync(configPath, templates.defaultConfig(name.toString()));
			logger.info('[✓] Config created src/lib/config/rime.config.ts');
		} else {
			logger.info('[✓] Config already exists (skip)');
		}
	}

	function setDatabase() {
		const dbPath = path.join(process.cwd(), 'db');
		if (!existsSync(dbPath)) {
			mkdirSync(dbPath);
			logger.info('[✓] Database folder created');
		} else {
			logger.info('[✓] Database folder already exists (skip)');
		}
	}

	function setDrizzle(name: string) {
		const drizzleConfigPath = path.join(process.cwd(), 'drizzle.config.ts');
		if (!existsSync(drizzleConfigPath)) {
			writeFileSync(drizzleConfigPath, templates.drizzleConfig(name.toString()));
			logger.info('[✓] Drizzle config added');
		} else {
			logger.info('[✓] Drizzle config already exists (skip)');
		}
	}

	function configureVite() {
		const configPath = path.resolve(projectRoot, 'vite.config.ts');
		if (!existsSync(configPath)) {
			throw new Error("Can't find vite configuration file");
		}
		const content = readFileSync(configPath, 'utf-8');
		if (!content.includes('rime()')) {
			// Add import
			const newContent = content.replace(/(import .* from .*;\n?)/, `$1import { rime } from '${PACKAGE}/vite';\n`);

			// Add plugin to the list - ensure it's after sveltekit()
			const updatedContent = newContent.replace(/plugins:\s*\[([\s\S]*?)\]/, (match, plugins) => {
				// Check if sveltekit() is in the plugins list
				if (plugins.includes('sveltekit()')) {
					// Add rime() after sveltekit()
					return plugins.includes('sveltekit()')
						? match.replace('sveltekit()', 'sveltekit(), rime()')
						: `plugins: [${plugins}, rime()]`;
				} else {
					// If sveltekit() isn't found, add rime() at the end
					return `plugins: [${plugins}, rime()]`;
				}
			});
			writeFileSync(configPath, updatedContent);
			logger.info('[✓] Vite plugin added');
		} else {
			logger.info('[✓] Vite plugin already present (skip)');
		}
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
			logger.info('[✓] hooks.server.ts created');
		} else {
			logger.info('[✓] hooks.server.ts already exists (skip)');
		}
	}

	async function copyAssets() {
		try {
			const currentDir = path.dirname(fileURLToPath(import.meta.url));
			await mkdir(path.resolve(process.cwd(), 'static/panel/fonts'), { recursive: true });
			await cp(path.join(currentDir, '../../../../panel/fonts'), path.resolve(process.cwd(), 'static/panel/fonts'), {
				recursive: true
			});
			logger.info('[✓] Copied assets');
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
		setHooks();
		configureVite();
		await copyAssets();
		installDependencies();
		await generate({ force: true });
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
		installDependencies();
		await generate({ force: true });
		logger.info('[✓] done');
	}
};
