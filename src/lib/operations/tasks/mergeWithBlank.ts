import type { CompiledCollection, GenericDoc } from 'rizom/types';
import { isUploadConfig } from 'rizom/util/config.js';
import deepmerge from 'deepmerge';
import { createBlankDocument } from 'rizom/util/doc';
import type { DeepPartial } from 'rizom/types/util';

export const mergeWithBlankDocument = <T extends GenericDoc = GenericDoc>({
	data,
	config
}: {
	data: DeepPartial<T>;
	config: CompiledCollection;
}): T => {
	let file;
	if (config.type === 'collection' && isUploadConfig(config) && 'file' in data) {
		file = data.file;
		delete data.file;
	}	

	// @ts-ignore
	let dataMergedWithBlankDocument = deepmerge(createBlankDocument(config), data);
	
	// Add file after merge
	if (file) {
		(dataMergedWithBlankDocument as any).file = file;
	}

	return dataMergedWithBlankDocument as T;
};
