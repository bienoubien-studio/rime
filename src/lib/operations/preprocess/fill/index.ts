import type { Adapter } from 'rizom/types/adapter.js';
import { createBlankDocument } from '$lib/utils/doc.js';
import type { GenericDoc } from 'rizom/types/doc.js';
import { isUploadConfig } from 'rizom/config/utils.js';
import deepmerge from 'deepmerge';
import type { CompiledAreaConfig, CompiledCollectionConfig } from 'rizom/types/config.js';

export const mergeWithBlankDocument = <T extends GenericDoc>({
	data,
	config
}: {
	data: Partial<T>;
	config: CompiledCollectionConfig | CompiledAreaConfig;
}): T => {
	let file;
	if (config.type === 'collection' && isUploadConfig(config) && 'file' in data) {
		file = data.file;
		delete data.file;
	}

	console.log(data);
	/** Merge data with emptydoc so all required fields will be present in validate */
	const dataMergedWithBlankDocument = deepmerge<GenericDoc>(createBlankDocument(config), data);

	// Add file after merge
	if (file) {
		dataMergedWithBlankDocument.file = file;
	}

	return dataMergedWithBlankDocument as T;
};
