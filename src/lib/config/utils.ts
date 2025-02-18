import type {
	BuiltCollectionConfig,
	BuiltDocConfig,
	BuiltAreaConfig,
	CollectionConfig,
	CompiledCollectionConfig
} from 'rizom/types/config';
import type { WithUpload } from 'rizom/types/utility';

export function isUploadConfig(config: { upload?: boolean }): config is WithUpload<typeof config> {
	return 'upload' in config && config.upload === true;
}

export const isAuthConfig = (
	config: CollectionConfig<any> | BuiltCollectionConfig | CompiledCollectionConfig
) => config.auth === true;

export const isBuiltAreaConfig = (config: BuiltDocConfig): config is BuiltAreaConfig =>
	config.type === 'area';

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
