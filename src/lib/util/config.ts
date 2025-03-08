import type { BuiltCollection, Collection, CompiledCollection } from 'rizom/types';
import type { WithUpload } from 'rizom/types/util';

export function isUploadConfig(config: { upload?: boolean }): config is WithUpload<typeof config> {
	return 'upload' in config && config.upload === true;
}

export const isAuthConfig = (config: Collection<any> | BuiltCollection | CompiledCollection) =>
	config.auth === true;
