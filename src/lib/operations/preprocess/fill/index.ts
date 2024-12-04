import type { Adapter } from 'rizom/types/adapter.js';
import { safeFlattenDoc } from '$lib/utils/doc.js';

import { unflatten } from 'flat';
import type { ConfigMap } from '../config/map.js';
import { getDefaultValue } from './field.server.js';
import type { GenericDoc } from 'rizom/types/doc.js';

export const addDefaultValues: AddDefaultValues = async (args) => {
	const { data, configMap, adapter } = args;
	const flatData = safeFlattenDoc(data);

	for (const [key, config] of Object.entries(configMap)) {
		const hasDefaultValue = 'defaultValue' in config;
		let isEmpty;
		try {
			isEmpty = config.isEmpty(flatData[key]);
		} catch (err: any) {
			isEmpty = false;
			// console.log(config);
			console.log(err.message);
		}
		if (hasDefaultValue && isEmpty) {
			flatData[key] = await getDefaultValue({ key, config, adapter });
		}
	}

	return unflatten(flatData);
};

type AddDefaultValues<T extends GenericDoc = GenericDoc> = (args: {
	data: T;
	configMap: ConfigMap;
	adapter: Adapter;
}) => Promise<T>;
