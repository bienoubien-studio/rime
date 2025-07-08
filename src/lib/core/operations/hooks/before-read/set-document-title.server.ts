import type { GenericDoc, Prototype } from '$lib/core/types/doc.js';
import type { HookBeforeRead } from '$lib/core/config/types/index.js';
import { getValueAtPath } from '$lib/util/object.js';

export const setDocumentTitle: HookBeforeRead<Prototype, Partial<GenericDoc>> = async (args) => {
	const config = args.config;
	let doc = args.doc;
	
	const hasSelect = Array.isArray(args.context.params.select) && args.context.params.select.length
	const shouldSetTitle = !doc.title && !hasSelect;

	if (shouldSetTitle) {
		doc = {
			title: getValueAtPath(config.asTitle, doc),
			...doc
		};
	}
  
	return { ...args, doc };
};
