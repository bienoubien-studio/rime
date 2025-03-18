import type {
	BuiltCollection,
	Collection,
	CompiledCollection,
	Field,
	FormField
} from 'rizom/types';
import type { WithUpload } from 'rizom/types/util';
import { isBlocksFieldRaw, isFormField, isTabsFieldRaw } from './field';

export function isUploadConfig(config: { upload?: boolean }): config is WithUpload<typeof config> {
	return 'upload' in config && config.upload === true;
}

export const isAuthConfig = (config: Collection<any> | BuiltCollection | CompiledCollection) =>
	config.auth === true;
