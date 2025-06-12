import type { RequestEvent } from '@sveltejs/kit';
import { createBlankDocument } from '../../util/doc.js';
import { find } from './operations/find.js';
import { update } from './operations/update.js';
import type { CompiledArea } from '$lib/core/config/types/index.js';
import type { GenericDoc } from '$lib/core/types/doc.js';
import type { Rizom } from '../rizom.server.js';
import type { DeepPartial } from '$lib/util/types.js';

type Args = {
	config: CompiledArea;
	defaultLocale: string | undefined;
	event: RequestEvent;
};

/**
 * Interface for interacting with area documents
 *
 * Provides methods to create, retrieve, and update documents within an area.
 * Handles versioning, drafts, and localization according to the area configuration.
 *
 */
class AreaInterface<Doc extends GenericDoc = GenericDoc> {
	#event: RequestEvent;
	#rizom: Rizom;
	defaultLocale: string | undefined;
	config: CompiledArea;

	/**
	 * Creates a new AreaInterface instance
	 *
	 * @param args Constructor arguments
	 * @param args.config The compiled area configuration
	 * @param args.defaultLocale The default locale to use when none is specified
	 * @param args.event The current request event
	 */

	constructor({ config, defaultLocale, event }: Args) {
		this.config = config;
		this.#event = event;
		this.#rizom = event.locals.rizom;
		this.defaultLocale = defaultLocale;
		this.find = this.find.bind(this);
		this.update = this.update.bind(this);
	}

	/**
	 * Determines the locale to use, falling back to defaults if not provided
	 *
	 * @param locale Optional locale string
	 * @returns The locale to use, falling back to event locale or default locale
	 * @private
	 */
	#fallbackLocale(locale?: string) {
		return locale || this.#event.locals.locale || this.defaultLocale;
	}

	blank(): Doc {
		return createBlankDocument(this.config) as Doc;
	}

	/**
	 * Retrieves an area document with optional filtering and selection
	 *
	 * This method handles different retrieval scenarios based on the provided parameters:
	 * - For non-versioned areas: Returns the single document
	 * - For versioned areas without draft support: Returns the latest version by default or a specific version if versionId is provided
	 * - For versioned areas with draft support:
	 *   - If versionId is provided: Returns that specific version
	 *   - If draft=true: Returns the latest version (regardless of status)
	 *   - If draft=false: Returns the published version
	 *
	 * @example
	 * // Get the published version
	 * const doc = await rizom.area('settings').find({ locale })
	 *
	 * // Get a specific version
	 * const doc = await rizom.area('settings').find({ versionId: '123' })
	 *
	 * // Get the latest version excluding draft
	 * const doc = await rizom.area('settings').find()
	 *
	 * // Get the latest version including draft
	 * const doc = await rizom.area('settings').find({ draft: true })
	 */
	find({ locale, select = [], depth = 0, versionId, draft }: FindArgs): Promise<Doc> {
		this.#rizom.preventOperationLoop();

		const params = {
			locale: this.#fallbackLocale(locale),
			select,
			versionId,
			config: this.config,
			event: this.#event,
			rizom: this.#rizom,
			depth,
			draft
		};

		if (this.#event.locals.cacheEnabled) {
			const key = this.#event.locals.rizom.cache.createKey('area.find', {
				slug: this.config.slug,
				select,
				versionId,
				userRoles: this.#event.locals.user?.roles,
				depth,
				draft,
				locale
			});
			return this.#event.locals.rizom.cache.get(key, () => find<Doc>(params));
		}

		return find<Doc>(params);
	}

	/**
	 * Updates an area document with the provided data
	 *
	 * This method handles different update scenarios based on the provided parameters:
	 * - For non-versioned areas: Simply updates the document
	 * - For versioned areas without draft support:
	 *   - If versionId is provided: Updates that specific version
	 *   - If no versionId is provided: Creates a new version based on the latest
	 * - For versioned areas with draft support:
	 *   - If versionId is provided: Updates that specific version
	 *   - If no versionId and draft !== true: Updates the published version
	 *   - If no versionId and draft === true: Creates a new draft from the published version
	 *
	 * @param args - Object containing update parameters
	 * @param args.data - Partial document data to update
	 * @param args.locale - Optional locale for localized content
	 * @param args.versionId - Optional specific version ID to update
	 * @param args.draft - Optional flag to indicate draft mode
	 * @returns Promise resolving to the updated document
	 * @example
	 * rizom.area('settings').update({ data, locale })
	 */
	update({ data, locale, versionId, draft }: UpdateArgs<Doc>): Promise<Doc> {
		this.#rizom.preventOperationLoop();

		return update<Doc>({
			data,
			locale: this.#fallbackLocale(locale),
			versionId: versionId,
			draft,
			config: this.config,
			event: this.#event
		});
	}
}

export { AreaInterface };

type UpdateArgs<T> = {
	data: DeepPartial<T>;
	locale?: string;
	versionId?: string;
	draft?: boolean;
};

type FindArgs = {
	/** Optional locale for localized content */
	locale?: string;
	/** Optional specific version ID to retrieve */
	versionId?: string;
	/** Optional flag to indicate draft mode allowing the retrieve of draft documents */
	draft?: boolean;
	/** Optional depth for resolving relations */
	depth?: number;
	/** Optional array of fields to select */
	select?: string[];
};
