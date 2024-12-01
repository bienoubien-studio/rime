import type { ConfigMap } from '../preprocess/config/map.js';
import type { User } from 'rizom/types/auth.js';
import type { LocalAPI } from 'rizom/types/api';
import type { Dic } from 'rizom/types/utility.js';

export const postprocessFields: FilterFieldsArgs = async ({
	flatDoc,
	configMap,
	user,
	api,
	locale
}) => {
	for (const [key, config] of Object.entries(configMap)) {
		//
		if (config.access && config.access.read) {
			const authorized = config.access.read(user);
			if (!authorized) {
				delete flatDoc[key];
			}
			continue;
		}

		if (config.hooks?.beforeRead) {
			if (flatDoc[key]) {
				for (const hook of config.hooks.beforeRead) {
					flatDoc[key] = await hook(flatDoc[key], { config, api, locale });
				}
			}
		}
	}
	return flatDoc;
};

type FilterFieldsArgs = (args: {
	api: LocalAPI;
	flatDoc: Dic;
	locale?: string;
	configMap: ConfigMap;
	user: User | undefined;
}) => Promise<Dic>;
