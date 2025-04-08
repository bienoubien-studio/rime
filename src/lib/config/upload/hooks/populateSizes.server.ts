import type { CompiledCollection } from 'rizom/types/config.js';
import type { GenericDoc } from 'rizom/types/doc.js';
import type { CollectionHookBeforeRead } from 'rizom/types/hooks.js';
import type { WithUpload } from 'rizom/types/util.js';

export const populateSizes: CollectionHookBeforeRead<GenericDoc> = async (args) => {
	const config = args.config as WithUpload<CompiledCollection>;
	const doc = args.doc;
	
	if ('imageSizes' in config && config.imageSizes) {
		doc.sizes = {};
		for (const size of config.imageSizes) {
			if (doc[size.name]) {
				// Handle multiple formats
				const formats = doc[size.name].split('|') as string[];
				// Multiple formats
				if (formats.length > 1) {
					formats.forEach((format) => {
						const extension = format.split('.').pop()!;
						doc.sizes[`${size.name}_${extension}`] = `/medias/${format}`;
					});
				// Single format
				} else {
					doc.sizes[size.name] = `/medias/${formats[0]}`;
				}				
				delete doc[size.name];
			} else {
				// Default case: use original file as string
				doc.sizes[size.name] = `/medias/${doc.filename}`;
			}
		}

		// Add the _thumbnail prop
		if( 'thumbnail' in doc.sizes ){
			doc._thumbnail = doc.sizes.thumbnail
		}else{
			const thumbnailKey = Object.keys(doc.sizes).find((sizeName) => sizeName.startsWith('thumbnail'))
			if(thumbnailKey){
				doc._thumbnail = doc.sizes[thumbnailKey]
			}else{
				doc._thumbnail = `/medias/${doc.filename}`
			}
		}
	}

	doc.url = `/medias/${doc.filename}`

	return { ...args, doc };
};
