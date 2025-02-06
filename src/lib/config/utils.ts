import type {
	BuiltCollectionConfig,
	BuiltDocConfig,
	BuiltGlobalConfig,
	BuiltUploadCollectionConfig,
	CollectionConfig,
	CompiledCollectionConfig,
	CompiledUploadCollectionConfig,
	UploadCollectionConfig
} from 'rizom/types/config';

export function isUploadConfig(
	config: CollectionConfig | BuiltCollectionConfig | CompiledCollectionConfig
): config is UploadCollectionConfig | BuiltUploadCollectionConfig | CompiledUploadCollectionConfig {
	return 'upload' in config && config.upload === true;
}

export const isAuthConfig = (
	config: CollectionConfig | BuiltCollectionConfig | CompiledCollectionConfig
) => config.auth === true;

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
