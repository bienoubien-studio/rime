import { getValueAtPath } from '$lib/util/object.js';
import { Hooks } from '../index.server.js';

export const setDocumentTitle = Hooks.beforeRead<'raw'>(async (args) => {
	const config = args.config;
	let doc = args.doc;

	const hasSelect = Array.isArray(args.context.params.select) && args.context.params.select.length;
	const shouldSetTitle = !doc.title && !hasSelect;

	if (shouldSetTitle) {
		doc = {
			title: getValueAtPath(config.asTitle, doc),
			...doc
		};
	}

	return { ...args, doc };
});
