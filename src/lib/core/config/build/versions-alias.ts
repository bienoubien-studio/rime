import { makeVersionsTableName } from "$lib/util/schema.js";
import type { CollectionSlug } from "../../../types.js";
import type { CompiledCollection, CompiledConfig } from "../types/index.js";

/**
 * Creates versioned collection aliases for collections and areas with versioning enabled
 * @param config The compiled configuration object containing collections and areas
 * @returns The updated configuration with versioned collections added
 * @example
 * // If a collection "pages" has versions enabled, this will create a "pages_versions" collection
 * // if an area "settings" has versions enabled, this will create also a "settings_versions" collection
 * const updatedConfig = makeVersionsCollectionsAliases(config);
 */
export function makeVersionsCollectionsAliases(config: CompiledConfig) {
  
  for (const collection of config.collections) {
    if (collection.versions) {
      const versionedCollection: CompiledCollection = {
        slug: makeVersionsTableName(collection.slug) as CollectionSlug,
        versions: false,
        access: collection.access,
        fields: collection.fields,
        auth: collection.auth,
        upload: collection.upload,
        label: collection.label,
        type: collection.type,
        asTitle: collection.asTitle,
      }
      config.collections = [...config.collections, versionedCollection]
    }
  }
  
  for (const area of config.areas) {
    if (area.versions) {
      const versionedCollection: CompiledCollection = {
        slug: makeVersionsTableName(area.slug) as CollectionSlug,
        versions: false,
        access: area.access,
        fields: area.fields,
        type: 'collection',
        label: { plural: area.label, singular: area.label, gender: 'm' },
      } as CompiledCollection
      config.collections = [...config.collections, versionedCollection]
    }
  }

  return config
}