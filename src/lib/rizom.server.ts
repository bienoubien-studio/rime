import createAdapter from '$lib/db/index.server.js';
import path from 'path';
import { randomId } from './util/random.js';
import { createConfigInterface } from './config/index.server.js';
import { existsSync } from 'fs';
import type { RequestEvent } from '@sveltejs/kit';
import type { AsyncReturnType } from './types/util.js';
import type { Config, Plugins } from 'rizom';
import { RizomError } from './errors/index.js';
import { registerTranslation } from '$lib/panel/i18n/register.server.js';
import i18n from './panel/i18n/index.js';

const dev = process.env.NODE_ENV === 'development';

function createRizom() {
	//
	let initialized = false;
	let adapter: ReturnType<typeof createAdapter>;
	let config: AsyncReturnType<typeof createConfigInterface>;
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

	const init = async ({ config: rawConfig, schema }: InitArgs) => {
		initialized = false;
		if (dev && !hasRunInitCommand()) {
			throw new RizomError(RizomError.INIT, 'Missing required files, run `npx rizom-init`');
		}
		// Initialize config
		config = await createConfigInterface(rawConfig);

		// Initialize DB
		adapter = createAdapter({ schema, configInterface: config });

		// Panel Language
		const dictionnaries = await registerTranslation(config.raw.panel.language);
		i18n.init(dictionnaries);

		// Done
		initialized = true;
	};

	return {
		key,
		init,

		get initialized() {
			return initialized;
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
			return config.get('plugins') as Plugins;
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
	return instance;
};

export default getInstance();

export type Rizom = ReturnType<typeof createRizom>;
type InitArgs = { config: Config; schema: any };
