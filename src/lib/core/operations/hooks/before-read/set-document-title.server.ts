import type { GenericDoc, Prototype } from '$lib/core/types/doc.js';
import type { HookBeforeRead } from '$lib/core/config/types/hooks.js';
import { getValueAtPath, hasProp } from '$lib/util/object.js';

export const setDocumentTitle: HookBeforeRead<Prototype, Omit<GenericDoc, 'title'>> = async (args) => {
	
	const config = args.config;
	let doc = args.doc;
	const hasSelect = Array.isArray(args.metas.select) && args.metas.select.length
	
	if (!hasProp('title', doc) && !hasSelect) {
		doc = {
			title: getValueAtPath(config.asTitle, doc),
			...doc
		};
	}
  
	return { ...args, doc };
};
