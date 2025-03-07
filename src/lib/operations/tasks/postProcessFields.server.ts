import { deleteValueAtPath, getValueAtPath, setValueAtPath } from 'rizom/utils/object';
import type { ConfigMap } from './configMap/types';
import type { LocalAPI, User } from 'rizom/types';
import type { Dic } from 'rizom/types/utility';

export const postprocessFields = async <T extends Dic>(args: {
	document: T;
	configMap: ConfigMap;
	user?: User;
	api: LocalAPI;
	locale?: string;
}) => {
	const { configMap, user, api, locale } = args;
	let document = args.document;

	for (const [key, config] of Object.entries(configMap)) {
		//
		if (config.access && config.access.read) {
			const authorized = config.access.read(user);
			if (!authorized) {
				document = deleteValueAtPath(document, key);
				continue;
			}
		}

		if (config.hooks?.beforeRead) {
			let value = getValueAtPath(document, key);
			if (value) {
				for (const hook of config.hooks.beforeRead) {
					value = await hook(value, { config, api, locale });
					document = setValueAtPath(document, key, value);
				}
			}
		}
	}

	return document;
};
