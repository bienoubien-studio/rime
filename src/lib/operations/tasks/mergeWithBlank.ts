import type { CompiledCollection, GenericDoc } from 'rizom/types';
import { isUploadConfig } from 'rizom/config/utils';
import deepmerge from 'deepmerge';
import { createBlankDocument } from 'rizom/utils/doc';

export const mergeWithBlankDocument = <T extends GenericDoc>({
	data,
	config
}: {
	data: Partial<T>;
	config: CompiledCollection;
}): T => {
	let file;
	if (config.type === 'collection' && isUploadConfig(config) && 'file' in data) {
		file = data.file;
		delete data.file;
	}

	const dataMergedWithBlankDocument = deepmerge<GenericDoc>(createBlankDocument(config), data);

	// Add file after merge
	if (file) {
		dataMergedWithBlankDocument.file = file;
	}

	return dataMergedWithBlankDocument as T;
};
