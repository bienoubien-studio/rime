import type { CompiledCollection, GenericDoc } from 'rizom/types';
import { isUploadConfig } from 'rizom/util/config.js';
import deepmerge from 'deepmerge';
import { createBlankDocument } from 'rizom/util/doc';

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

	// Configure deepmerge to preserve tab structure
	const options = {
		clone: true,
		// Only merge arrays if they are at the root level or in specific fields that should be merged
		arrayMerge: (target: any[], source: any[], options: any) => {
			// For fields like blocks, relations, etc. that should be merged
			if (Array.isArray(source)) {
				return source;
			}
			return target;
		}
	};

	const dataMergedWithBlankDocument = deepmerge<GenericDoc>(
		createBlankDocument(config),
		data,
		options
	);

	// Add file after merge
	if (file) {
		dataMergedWithBlankDocument.file = file;
	}

	return dataMergedWithBlankDocument as T;
};
