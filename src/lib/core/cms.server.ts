import createAdapter from '$lib/adapter-sqlite/index.server.js';
import { randomId } from '../util/random.js';
import { createConfigInterface } from './config/index.server.js';
import { RizomError } from './errors/index.js';
import { registerTranslation } from '$lib/core/i18n/register.server.js';
import { hasRunInitCommand } from './dev/cli/util.server.js';
import { logger } from './logger/index.server.js';
import i18n from './i18n/index.js';
import type { AsyncReturnType } from '../util/types.js';
import type { Config } from '$lib/core/config/types/index.js';
import type { Plugins } from '$lib/core/types/plugins.js';

const dev = process.env.NODE_ENV === 'development';

function createCMS() {
	//
	let initialized = false;
	let adapter: ReturnType<typeof createAdapter>;
	let config: AsyncReturnType<typeof createConfigInterface>;
	const key: string = randomId(12);
	
	//////////////////////////////////////////////
	// Init
	//////////////////////////////////////////////

	const init = async ({ config: rawConfig, schema }: InitArgs) => {
		initialized = false;
		if (dev && !hasRunInitCommand()) {
			throw new RizomError(RizomError.INIT, 'Missing required files, run `npx rizom init`');
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
		
		get adapter() {
			return adapter;
		},

		get config() {
			return config;
		},

	};

}

//////////////////////////////////////////////
// Singleton pattern
//////////////////////////////////////////////

let instance: CMS;

const getInstance = () => {
	if (instance) {
		logger.info('import rizom instance ' + instance.key);
		return instance;
	}
	console.log('')
	logger.info('create rizom instance');
	instance = createCMS();
	return instance;
};

export default getInstance();

export type CMS = ReturnType<typeof createCMS>;
type InitArgs = { config: Config; schema: any };
