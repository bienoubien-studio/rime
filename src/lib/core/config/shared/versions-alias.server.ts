import { makeVersionsSlug } from '$lib/adapter-sqlite/generate-schema/util.js';
import { augmentHooks } from '$lib/core/collections/config/augment-hooks.js';
import type { CollectionSlug } from '$lib/core/types/doc.js';
import type { BuiltCollection, BuiltConfig } from '../types';

/**
 * Creates versioned collection aliases for collections and areas with versioning enabled
 *
 * @example
 * // If a collection "pages" has versions enabled, this will create a "pages_versions" collection
 * // if an area "settings" has versions enabled, this will create also a "settings_versions" collection
 * const updatedConfig = makeVersionsCollectionsAliases(config);
 */
export function makeVersionsCollectionsAliases(config: BuiltConfig) {
	for (const collection of config.collections) {
		if (collection.versions) {
			const versionedCollection: BuiltCollection = {
				slug: makeVersionsSlug(collection.slug) as CollectionSlug,
				versions: undefined,
				access: collection.access,
				$hooks: collection.$hooks,
				fields: collection.fields,
				auth: collection.auth,
				upload: collection.upload,
				label: collection.label,
				type: collection.type,
				asTitle: collection.asTitle,
				icon: collection.icon,
				panel: false
			};
			config.collections = [...config.collections, versionedCollection];
		}
	}

	for (const area of config.areas) {
		if (area.versions) {
			let versionedCollection: BuiltCollection = {
				slug: makeVersionsSlug(area.slug) as CollectionSlug,
				versions: undefined,
				access: area.access,
				asTitle: area.asTitle,
				$hooks: area.$hooks,
				fields: area.fields,
				type: 'collection',
				label: { plural: area.label, singular: area.label },
				panel: false
			} as BuiltCollection;

			versionedCollection = augmentHooks(versionedCollection);

			config.collections = [...config.collections, versionedCollection];
		}
	}

	return config;
}
