import type { GenericDoc, Prototype } from '$lib/core/types/doc.js';
import type { HookBeforeRead } from '$lib/core/config/types/hooks.js';

export const setDocumentLocale: HookBeforeRead<Prototype, GenericDoc> = async (args) => {
	let doc = args.doc;
	
	const hasSelect = Array.isArray(args.metas.select) && args.metas.select.length
	
	if (args.event.locals.locale && !hasSelect) {
		doc = { ...doc, locale: args.event.locals.locale };
	}
	
	return { ...args, doc };
};
