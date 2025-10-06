import createAdapter from '$lib/adapter-sqlite/index.server.js';
import type { BuiltConfig, CompiledConfig } from '$lib/core/config/types.js';
import { registerTranslation } from '$lib/core/i18n/register.server.js';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import { randomId } from '../util/random.js';
import type { AsyncReturnType } from '../util/types.js';
import { createConfigInterface } from './config/interface.server.js';
import { hasRunInitCommand } from './dev/cli/util.server.js';
import { RimeError } from './errors/index.js';
import i18n from './i18n/index.js';
import { logger } from './logger/index.server.js';

const dev = process.env.NODE_ENV === 'development';

/**
 * Creates a CMS instance with configuration, database adapter, and utility methods
 * @returns A CMS instance with initialization and access methods
 */
function createCMS() {
	let initialized = false;
	let adapter: ReturnType<typeof createAdapter>;
	let config: AsyncReturnType<typeof createConfigInterface>;
	const key: string = randomId(12);

	/**
	 * Ensures that the media directory exists for upload collections
	 * @param config The compiled configuration
	 */
	const ensureMediasDirectory = (config: CompiledConfig) => {
		const hasUpload = config.collections.some((collection) => !!collection.upload);
		if (hasUpload) {
			const mediasDirectory = path.resolve(process.cwd(), 'static/medias');
			if (!existsSync(mediasDirectory)) {
				mkdirSync(mediasDirectory, { recursive: true });
			}
		}
	};

	/**
	 * Initializes the CMS with configuration and database schema
	 * @param options Initialization options containing config and schema
	 * @throws {RimeError} If required files are missing in development mode
	 */
	const init = async ({ config: rawConfig, schema }: InitArgs) => {
		initialized = false;

		if (dev && !hasRunInitCommand()) {
			throw new RimeError(RimeError.INIT, 'Missing required files, run `npx rime init`');
		}

		// Initialize config
		config = await createConfigInterface(rawConfig);

		// Ensure media directory exists or create it
		ensureMediasDirectory(config.raw);

		// Initialize DB
		adapter = createAdapter({ schema, configInterface: config });

		// Register dictionaries for panel Language
		const dictionnaries = await registerTranslation(config.raw.panel.language);
		i18n.init(dictionnaries);

		initialized = true;
	};

	return {
		/**
		 * Unique identifier for this CMS instance
		 */
		key,

		/**
		 * Initializes the CMS with configuration and database schema
		 */
		init,

		/**
		 * Indicates whether the CMS has been initialized
		 * @returns True if the CMS is initialized, false otherwise
		 */
		get initialized() {
			return initialized;
		},

		/**
		 * Gets the database adapter for this CMS instance
		 * @returns The database adapter
		 */
		get adapter() {
			return adapter;
		},

		/**
		 * Gets the configuration interface for this CMS instance
		 * @returns The configuration interface
		 */
		get config() {
			return config;
		}
	};
}

/**
 * Singleton pattern implementation for the CMS
 * Ensures only one instance of the CMS exists throughout the application
 */
let instance: CMS;

/**
 * Gets the singleton instance of the CMS
 * @returns The CMS instance
 */
const getInstance = () => {
	if (instance) {
		logger.info('import rime instance ' + instance.key);
		return instance;
	}
	console.log('');
	logger.info('create rime instance');
	instance = createCMS();
	return instance;
};

export default getInstance();

/**
 * Type representing a CMS instance
 */
export type CMS = ReturnType<typeof createCMS>;

/**
 * Type for the initialization arguments
 */
type InitArgs = { config: BuiltConfig; schema: any };
