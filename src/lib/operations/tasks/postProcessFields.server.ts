import { deleteValueAtPath, getValueAtPath, setValueAtPath } from 'rizom/util/object.js';
import type { ConfigMap } from './configMap/types.js';
import type { User } from '$lib/types/auth.js';
import type { Dic } from '$lib/types/util';
import type { LocalAPI } from '$lib/operations/localAPI/index.server.js';
import type { RequestEvent } from '@sveltejs/kit';

export const postprocessFields = async <T extends Dic>(args: {
	document: T;
	configMap: ConfigMap;
	event: RequestEvent;
}) => {
	const { configMap, event } = args;
	let document = args.document;

	for (const [key, config] of Object.entries(configMap)) {
		//
		if (config.access && config.access.read) {
			const authorized = config.access.read(event.locals.user);
			if (!authorized) {
				document = deleteValueAtPath(document, key);
				continue;
			}
		}

		if (config.hooks?.beforeRead) {
			let value = getValueAtPath(key, document);
			if (value) {
				for (const hook of config.hooks.beforeRead) {
					value = await hook(value, { event, config, documentId: document.id });
					document = setValueAtPath(document, key, value);
				}
			}
		}
	}
	
	return document;
};
