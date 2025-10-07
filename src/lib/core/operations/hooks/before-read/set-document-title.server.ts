import { getValueAtPath } from '$lib/util/object.js';
import { Hooks } from '../index.server.js';

export const setDocumentTitle = Hooks.beforeRead<'raw'>(async (args) => {
	const config = args.config;
	let doc = args.doc;

	const paramSelect = args.context.params.select;
	const hasSelect = Array.isArray(paramSelect) && paramSelect.length;
	const shouldSetTitle = !doc.title && (!hasSelect || (hasSelect && paramSelect.includes('title')));

	if (shouldSetTitle) {
		doc = {
			title: getValueAtPath(config.asTitle, doc),
			...doc
		};
	}

	return { ...args, doc };
});
