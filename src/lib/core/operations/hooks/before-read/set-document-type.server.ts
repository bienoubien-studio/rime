import type { GenericDoc, Prototype } from '$lib/core/types/doc.js';
import type { HookBeforeRead } from '$lib/core/config/types/hooks.js';

export const setDocumentType: HookBeforeRead<Prototype, Omit<GenericDoc, 'title'>> = async (args) => {
	const config = args.config;
	let doc = args.doc;

	const hasSelect = Array.isArray(args.metas.select) && args.metas.select.length

	if (!hasSelect) {
		doc = {
			...doc,
			_prototype: config.type,
			_type: config.slug
		};
	}

	return { ...args, doc };
};
