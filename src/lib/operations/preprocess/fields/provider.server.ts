import type { Dic } from 'rizom/types/utility';
import { buildConfigMap } from '../config/map';
import { flatten, unflatten } from 'flat';
import { getValueAtPath } from 'rizom/utils/doc';
import { getDefaultValue } from '../fill/field.server';
import { RizomError, RizomFormError } from 'rizom/errors';
import type { Adapter, FormErrors, GenericDoc, LocalAPI, PrototypeSlug, User } from 'rizom/types';
import { hasProps } from 'rizom/utils/object';

type CreateFieldProviderArgs = { data: Dic; fields: any[] };
export const createFieldProvider = ({ data, fields }: CreateFieldProviderArgs) => {
	const configMap = buildConfigMap(data, fields);
	let flatData: Dic = flatten(data);

	const getValue = (path: string) => {
		if (flatData[path]) {
			return flatData[path];
		}
		return getValueAtPath(data, path);
	};

	const useFieldServer = (path: string) => {
		return {
			get config() {
				return configMap[path];
			},
			get value() {
				return getValue(path);
			}
		};
	};

	const completeWithDefault = async (args: { adapter: Adapter }) => {
		const { adapter } = args;
		const output = { ...flatData };

		for (const [key, config] of Object.entries(configMap)) {
			const field = useFieldServer(key);
			let isEmpty;
			try {
				isEmpty = config.isEmpty(field.value);
			} catch (err: any) {
				isEmpty = false;
				console.log(err.message);
			}
			if (isEmpty && hasProps(config, ['defaultValue'])) {
				output[key] = await getDefaultValue({ key, config, adapter });
			}
		}

		flatData = output;
		data = unflatten(output);

		return data;
	};

	const validate: Validate = async ({ operation, documentId, user, slug, locale, api }) => {
		const errors: FormErrors = {};
		const { adapter } = api.rizom;
		const isCollection = api.rizom.config.getDocumentPrototype(slug);

		for (const [key, config] of Object.entries(configMap)) {
			const field = useFieldServer(key);

			if (key === 'hashedPassword') {
				//
				// hashedPassword is a mandatory field added while building config
				// so it's present in configMap.
				// Value should be empty and populated in hookBefore[Create/Update]
				// defined in rizom/auth/hooks.server.ts
				//
				// [EDIT] Should not be there with better-auth
				//
				if (field.value) {
					throw new RizomError('hashedPassword should be empty while preprocessing incoming data');
				}
				// No need for validation / transform / access
				continue;
			}

			/////////////////////////////////////////////
			// Validation
			//////////////////////////////////////////////

			// Required
			if (config.required && config.isEmpty(field.value)) {
				errors[key] = RizomFormError.REQUIRED_FIELD;
			}

			// Unique
			/** @TODO better unique check like nested ones, locale,...
			 *   possible to handle this with a try catch on DB update/create
			 *   and parse the sqlite error
			 */
			if ('unique' in config && config.unique && isCollection) {
				const query = { where: { [key]: { equals: field.value } } };
				const existing = await adapter.collection.query({ slug, query });
				if (existing.length && existing[0].id !== documentId) {
					errors[key] = RizomFormError.UNIQUE_FIELD;
				}
			}

			/////////////////////////////////////////////
			// Transform before validate
			//////////////////////////////////////////////

			if (config.hooks?.beforeValidate) {
				if (field.value) {
					for (const hook of config.hooks.beforeValidate) {
						flatData[key] = await hook(field.value, { config, api, locale });
					}
				}
			}

			/////////////////////////////////////////////
			// Validate
			//////////////////////////////////////////////

			if (config.validate && field.value) {
				try {
					const valid = config.validate(field.value, {
						data,
						operation,
						id: documentId,
						user,
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
				if (field.value) {
					for (const hook of config.hooks.beforeSave) {
						flatData[key] = await hook(field.value, { config, api, locale });
					}
				}
			}

			/////////////////////////////////////////////
			// Access
			//////////////////////////////////////////////

			if (config.access && config.access.update && operation === 'update') {
				const authorizedFieldUpdate = config.access.update(user, {
					id: documentId
				});
				if (!authorizedFieldUpdate) {
					delete flatData[key];
				}
			}

			if (config.access && config.access.create && operation === 'create') {
				const authorizedFieldCreate = config.access.create(user, {
					id: undefined
				});
				if (!authorizedFieldCreate) {
					delete flatData[key];
				}
			}
		}

		data = unflatten(flatData);

		return {
			errors: Object.keys(errors).length ? errors : null
		};
	};

	return {
		configMap,
		getValue,
		useFieldServer,
		completeWithDefault,
		validate,
		get data() {
			return data;
		},
		set data(value) {
			data = value;
			flatData = flatten(value);
		}
	};
};

export type FieldProviderServer = ReturnType<typeof createFieldProvider>;
type Validate = (args: {
	operation: 'update' | 'create';
	user: User | undefined;
	locale: string | undefined;
	documentId: string | undefined;
	slug: PrototypeSlug;
	api: LocalAPI;
}) => Promise<{
	errors: FormErrors | null;
}>;
