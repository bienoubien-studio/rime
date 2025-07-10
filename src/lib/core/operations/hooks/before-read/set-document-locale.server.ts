import { Hooks } from '../index.js';

export const setDocumentLocale = Hooks.beforeRead<'generic'>( async (args) => {
	let doc = args.doc;
	
	const hasSelect = Array.isArray(args.context.params.select) && args.context.params.select.length
	const locale = args.context.params.locale || args.event.locals.locale
	const shouldSetLocale = locale && !doc.locale && (!hasSelect || args.context.params.select?.includes('locale'));

	if (shouldSetLocale) {
		doc = { ...doc, locale: args.event.locals.locale };
	}
	
	return { ...args, doc };
});
