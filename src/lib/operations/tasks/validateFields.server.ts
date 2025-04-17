import { RizomError, RizomFormError } from '$lib/errors';
import type { Adapter } from '$lib/sqlite/index.server.js';
import type { CompiledArea, CompiledCollection } from '$lib/types/config.js';
import type { GenericDoc } from '$lib/types/doc.js';
import type { FormErrors } from '$lib/types/panel.js';
import type { User } from '$lib/types/auth.js';
import type { LocalAPI } from '$lib/operations/localAPI/index.server.js';
import type { ConfigMap } from './configMap/types';
import { deleteValueAtPath, getValueAtPath, setValueAtPath } from '$lib/util/object';
import type { DeepPartial } from '$lib/types/util';
import { logger } from '$lib/util/logger/index.server';

export const validateFields = async <T extends GenericDoc>(args: {
	data: DeepPartial<T>;
	api: LocalAPI;
	locale?: string;
	config: CompiledArea | CompiledCollection;
	configMap: ConfigMap;
	original?: T;
	operation: 'create' | 'update';
	user?: User;
}) => {
	const errors: FormErrors = {};
	const { api, locale, configMap, original, operation, user } = args;
	const slug = args.config.slug;
	const isCollection = api.rizom.config.isCollection(slug);
	let output = { ...args.data };

	for (const [key, config] of Object.entries(configMap)) {
		let value: any = getValueAtPath(key, output);
		
		/////////////////////////////////////////////
		// Validation
		//////////////////////////////////////////////

		// Required
		if (config.required && config.isEmpty(value)) {
			errors[key] = RizomFormError.REQUIRED_FIELD;
		}

		// Unique
		/** @TODO better unique check like relations, locale,...
		 *   possible to handle this with a try catch at DB operation
		 *   and parse the sqlite error ??
		 */
		if ('unique' in config && config.unique && isCollection) {
			const query =
				operation === 'create'
					? `where[${key}][equals]=${value}`
					: `where[and][0][${key}][equals]=${value}&where[and][1][id][not_equals]=${original?.id}`;
			const existing = await api.collection(slug).find({ locale, query });
			if (existing.length) {
				errors[key] = RizomFormError.UNIQUE_FIELD;
			}
		}

		/////////////////////////////////////////////
		// Field hook before validate
		//////////////////////////////////////////////

		if (config.hooks?.beforeValidate) {
			if (value) {
				for (const hook of config.hooks.beforeValidate) {
					value = await hook(value, { config, api, locale });
					output = setValueAtPath(output, key, value);
				}
			}
		}

		/////////////////////////////////////////////
		// Validate
		//////////////////////////////////////////////

		if (config.validate && value) {
			try {
				const valid = config.validate(value, {
					data: output as Partial<GenericDoc>,
					operation,
					id: original?.id,
					user: user,
					locale,
					config
				});
				if (valid !== true) {
					errors[key] = valid;
				}
			} catch (err: any) {
				logger.warn(`Error while validating field ${key}`);
				errors[key] = RizomFormError.VALIDATION_ERROR;
			}
		}

		/////////////////////////////////////////////
		// Field hook before Save
		//////////////////////////////////////////////

		if (config.hooks?.beforeSave) {
			if (value) {
				for (const hook of config.hooks.beforeSave) {
					value = await hook(value, { config, api, locale });
					output = setValueAtPath(output, key, value);
				}
			}
		}

		/////////////////////////////////////////////
		// Access
		//////////////////////////////////////////////

		if (config.access && config.access.update && operation === 'update') {
			const authorizedFieldUpdate = config.access.update(user, {
				id: original?.id
			});
			if (!authorizedFieldUpdate) {
				output = deleteValueAtPath(output, key);
			}
		}

		if (config.access && config.access.create && operation === 'create') {
			const authorizedFieldCreate = config.access.create(user, {
				id: undefined
			});
			if (!authorizedFieldCreate) {
				output = deleteValueAtPath(output, key);
			}
		}
	}
	
	if (Object.keys(errors).length) {
		throw new RizomFormError(errors);
	}

	return output;
};
