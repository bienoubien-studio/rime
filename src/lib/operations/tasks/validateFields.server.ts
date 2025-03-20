import { RizomError, RizomFormError } from 'rizom/errors';
import type {
	CompiledArea,
	CompiledCollection,
	FormErrors,
	GenericDoc,
	LocalAPI,
	User
} from 'rizom/types';
import type { ConfigMap } from './configMap/types';
import { deleteValueAtPath, getValueAtPath, setValueAtPath } from 'rizom/util/object';
import type { DeepPartial } from 'rizom/types/util';

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

		if (key === 'hashedPassword') {
			//
			// hashedPassword is a mandatory field added while building config
			// so it's present in configMap.
			// Value should be empty and populated in hookBefore[Create/Update]
			// defined in rizom/auth/hooks.server.ts
			//
			// [EDIT] Should not be there with better-auth
			//
			if (getValueAtPath(key, output)) {
				throw new RizomError('hashedPassword should be empty while preprocessing incoming data');
			}
			// No need for validation / transform / access
			continue;
		}

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
		// Transform before validate
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
				console.log(err);
				errors[key] = RizomFormError.VALIDATION_ERROR;
			}
		}

		/////////////////////////////////////////////
		// Transform to DB compliency
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
				output = deleteValueAtPath(output, value);
			}
		}

		if (config.access && config.access.create && operation === 'create') {
			const authorizedFieldCreate = config.access.create(user, {
				id: undefined
			});
			if (!authorizedFieldCreate) {
				output = deleteValueAtPath(output, value);
			}
		}
	}

	if (Object.keys(errors).length) {
		console.log(errors);
		throw new RizomFormError(errors);
	}

	return output;
};
