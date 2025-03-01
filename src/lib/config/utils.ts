import type {
	BuiltCollection,
	BuiltDocConfig,
	BuiltArea,
	Collection,
	CompiledCollection
} from 'rizom/types/config';
import type { WithUpload } from 'rizom/types/utility';

export function isUploadConfig(config: { upload?: boolean }): config is WithUpload<typeof config> {
	return 'upload' in config && config.upload === true;
}

export const isAuthConfig = (config: Collection<any> | BuiltCollection | CompiledCollection) =>
	config.auth === true;

export const isBuiltArea = (config: BuiltDocConfig): config is BuiltArea => config.type === 'area';

export const isBuiltCollection = (config: BuiltDocConfig): config is BuiltCollection =>
	config.type === 'collection';

// export const pathToConfigMap = (doc:Dic, config:CMS.BuiltDocConfig) => {
//   for( const key of Object.keys(doc) ) {
//     const parts = key.split(',')
//     if( parts.length === 0 ){
//        config.fields.filter( field => field.name === key )
//     }
//   }
// }
