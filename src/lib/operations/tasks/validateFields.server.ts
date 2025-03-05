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
import { deleteValueAtPath, getValueAtPath, setValueAtPath } from 'rizom/utils/doc';

export const validateFields = async <T extends GenericDoc>(args: {
	data: Partial<T>;
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
	const { adapter } = api.rizom;
	const isCollection = api.rizom.config.getDocumentPrototype(args.config.slug);
	let output = { ...args.data };

	for (const [key, config] of Object.entries(configMap)) {
		let value: any = getValueAtPath(output, key);

		if (key === 'hashedPassword') {
			//
			// hashedPassword is a mandatory field added while building config
			// so it's present in configMap.
			// Value should be empty and populated in hookBefore[Create/Update]
			// defined in rizom/auth/hooks.server.ts
			//
			// [EDIT] Should not be there with better-auth
			//
			if (getValueAtPath(output, key)) {
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
			const query = { where: { [key]: { equals: value } } };
			// const query = `where[${key}][equals]=${field.value}`;
			const existing = await adapter.collection.query({ slug: args.config.slug, query });
			if (original?.id && existing.length && existing[0].id !== original?.id) {
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
