import type { CollectionHookBeforeRead, CompiledCollection } from 'rizom/types';
import type { WithUpload } from 'rizom/types/utility';

export const populateSizes: CollectionHookBeforeRead = async (args) => {
	const config = args.config as WithUpload<CompiledCollection>;
	const doc = args.doc;

	if ('imageSizes' in config && config.imageSizes) {
		doc.sizes = {};
		for (const size of config.imageSizes) {
			if (doc[size.name]) {
				// Handle multiple formats
				const formats = doc[size.name].split('|') as string[];

				if (formats.length > 1) {
					// Multiple formats case: use object
					doc.sizes[size.name] = {};
					formats.forEach((format) => {
						const extension = format.split('.').pop()!;
						doc.sizes[size.name][extension] = `/medias/${format}`;
					});
				} else {
					// Single format case: use string
					doc.sizes[size.name] = `/medias/${formats[0]}`;
				}

				delete doc[size.name];
			} else {
				// Default case: use original file as string
				doc.sizes[size.name] = `/medias/${doc.filename}`;
			}
		}
	}

	return { ...args, doc };
};
