import createAdapter from '$lib/db/index.server.js';
import path from 'path';
import { taskLogger } from './logger/index.js';
import { randomId } from './utils/random.js';
import { createConfigInterface } from './config/index.server.js';
import { createMailerInterface } from './mailer/index.server.js';
import { existsSync } from 'fs';
import { dev } from '$app/environment';
import { RizomInitError } from './errors/init.server.js';
import type { RequestEvent } from '@sveltejs/kit';
import type { AsyncReturnType } from './types/utility.js';
import type { GetRegisterType } from './types/doc.js';

function createRizom() {
	//
	let initialized = false;
	let adapter: ReturnType<typeof createAdapter>;
	let config: AsyncReturnType<typeof createConfigInterface>;
	let mailerInterface: ReturnType<typeof createMailerInterface>;
	const key: string = randomId(12);

	//////////////////////////////////////////////
	// Init
	//////////////////////////////////////////////
	const hasRunInitCommand = () => {
		const projectRoot = process.cwd();
		return (
			existsSync(path.resolve(projectRoot, './.env')) &&
			existsSync(path.resolve(projectRoot, './drizzle.config.ts')) &&
			existsSync(path.resolve(projectRoot, './src/lib/server/schema.ts')) &&
			existsSync(path.resolve(projectRoot, './db')) &&
			existsSync(path.resolve(projectRoot, './src/config'))
		);
	};

	const init = async () => {
		if (dev && !hasRunInitCommand()) {
			throw new RizomInitError('Missing required files, please run `rizom init` first');
		}
		// Initialize config
		config = await createConfigInterface();

		// Initialize mailer
		mailerInterface = createMailerInterface(config.get());

		// Initialize DB
		const schema = await getSchema();
		const drizzleKitConfig = await getDrizzleConfig();
		adapter = createAdapter({ schema: schema, drizzleKitConfig, configInterface: config });

		// Done
		initialized = true;
		taskLogger.done('CMS Initialized');
	};

	const getSchema = async () => {
		try {
			const pathToSchema = path.resolve(process.cwd(), './src/lib/server/schema.ts');
			const schema = await import(/* @vite-ignore */ pathToSchema);
			return schema;
		} catch (error) {
			console.error('Failed to import schema:', error);
			return {};
		}
	};

	const getDrizzleConfig = async () => {
		try {
			const pathToDrizzleConfig = path.resolve(process.cwd(), './drizzle.config.ts');

			const drizzleConfig = await import(/* @vite-ignore */ pathToDrizzleConfig);
			return drizzleConfig.default;
		} catch (error) {
			console.error('Failed to import drizzle kit config:', error);
			return {};
		}
	};

	const reloadConfig = async () => {
		await config.reload();
		mailerInterface.init(config.get());
	};

	return {
		key,
		init,
		reloadConfig,

		get initialized() {
			return initialized;
		},

		get mailer() {
			return mailerInterface.mailer;
		},

		get auth() {
			return adapter.auth;
		},

		get adapter() {
			return adapter;
		},

		get config() {
			return config;
		},

		defineLocale({ event }: { event: RequestEvent }) {
			const params = event.params;
			const searchParams = event.url.searchParams;
			const hasParams = searchParams.toString();
			const paramLocale = params.locale;
			const searchParamLocale = hasParams && searchParams.get('locale');
			const cookieLocale = event.cookies.get('Locale');
			const defaultLocale = config.getDefaultLocale();
			const locale = paramLocale || searchParamLocale || cookieLocale;
			if (locale && config.getLocalesCodes().includes(locale)) {
				// event.cookies.set('Locale', locale, { path: '.' });
				return locale;
			}
			// event.cookies.set('Locale', defaultLocale, { path: '.' });
			return defaultLocale;
		},

		get plugins() {
			return config.get('plugins') as GetRegisterType<'Plugins'>;
		}
	};
}

//////////////////////////////////////////////
// Singleton pattern
//////////////////////////////////////////////

let instance: Rizom;

const getInstance = () => {
	if (instance) {
		console.log('#### import rizom instance ' + instance.key);
		return instance;
	}
	instance = createRizom();

	taskLogger.info('Create CMS instance ' + instance.key);

	return instance;
};

export default getInstance();

export type Rizom = ReturnType<typeof createRizom>;
