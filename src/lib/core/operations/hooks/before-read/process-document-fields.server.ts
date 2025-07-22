import { deleteValueAtPath, getValueAtPath, setValueAtPath } from '$lib/util/object.js';
import { buildConfigMap } from '../../configMap/index.server.js';
import { Hooks } from '../index.js';

export const processDocumentFields = Hooks.beforeRead( async (args) => {
	const { event } = args;
	let doc = args.doc;
  
	const configMap = buildConfigMap(doc, args.config.fields);

	for (const [key, config] of Object.entries(configMap)) {
		if (config.access && config.access.read) {
			const authorized = config.access.read(event.locals.user);
			if (!authorized) {
				doc = deleteValueAtPath(doc, key);
				continue;
			}
		}

		if (config.hooks?.beforeRead) {
			let value = getValueAtPath(key, doc);
			if (value) {
				for (const hook of config.hooks.beforeRead) {
					value = await hook(value, { event, config, operation: args.context, documentId: doc.id });
					doc = setValueAtPath(key, doc, value);
				}
			}
		}
	}

	return { ...args, doc };
});
