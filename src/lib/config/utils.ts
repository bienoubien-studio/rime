// import config from '$lib/config/rizom.config';
import { toCamelCase } from '$lib/utils/string.js';

import type {
	BuiltCollectionConfig,
	BuiltDocConfig,
	BuiltGlobalConfig,
	CollectionConfig,
	UploadCollectionConfig
} from 'rizom/types/config';

export const getPanelThumbnailKey = (collectionConfig: UploadCollectionConfig): string => {
	if (collectionConfig.panelThumbnail) {
		return toCamelCase(collectionConfig.panelThumbnail);
	}
	return `admin`;
};

export const isUploadConfig = (config: CollectionConfig): config is UploadCollectionConfig =>
	!!config.upload;

export const isAuthConfig = (config: CollectionConfig | BuiltCollectionConfig) =>
	config.auth === true;

export const isBuiltGlobalConfig = (config: BuiltDocConfig): config is BuiltGlobalConfig =>
	config.type === 'global';

export const isBuiltCollectionConfig = (config: BuiltDocConfig): config is BuiltCollectionConfig =>
	config.type === 'collection';

// export const pathToConfigMap = (doc:Dic, config:CMS.BuiltDocConfig) => {
//   for( const key of Object.keys(doc) ) {
//     const parts = key.split(',')
//     if( parts.length === 0 ){
//        config.fields.filter( field => field.name === key )
//     }
//   }
// }
