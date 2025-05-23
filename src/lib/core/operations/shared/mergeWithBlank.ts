import deepmerge from 'deepmerge';
import { isUploadConfig } from '$lib/util/config.js';
import { createBlankDocument } from '$lib/util/doc.js';
import type { CompiledCollection } from '$lib/core/config/types/index.js';
import type { GenericDoc } from '$lib/core/types/doc.js';
import type { DeepPartial } from '$lib/util/types';

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

	//@ts-expect-error will fix this sometime
	const dataMergedWithBlankDocument = deepmerge(createBlankDocument(config), data);

	// Add file after merge
	if (file) {
		(dataMergedWithBlankDocument as any).file = file;
	}

	return dataMergedWithBlankDocument as T;
};
