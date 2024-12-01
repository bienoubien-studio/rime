import { unflatten } from 'flat';

import { RizomError } from '$lib/errors/error.server.js';
import type { ConfigMap } from './config/map.js';
import type { User } from 'rizom/types/auth.js';
import type { GenericDoc, PrototypeSlug } from 'rizom/types/doc.js';
import type { FormErrors } from 'rizom/types/panel.js';
import type { Dic } from 'rizom/types/utility.js';
import type { LocalAPI } from 'rizom/types/api.js';

export const preprocessFields: PreprocessFields = async ({
	data,
	flatData,
	configMap,
	operation,
	documentId,
	user,
	slug,
	locale,
	api
}) => {
	const errors: FormErrors = {};
	const { adapter } = api.rizom;
	const isCollection = api.rizom.config.getDocumentPrototype(slug);

	for (const [key, config] of Object.entries(configMap)) {
		if (key === 'hashedPassword') {
			// hashedPassword is a mandatory field added while building config
			// so it's present in configMap.
			// Value should be empty and populated in hookBefore[Create/Update]
			// defined in rizom/auth/hooks.server.ts
			if (flatData[key]) {
				throw new RizomError('hashedPassword should be empty while preprocessing incoming data');
			}
			// No need for validation / transform / access
			continue;
		}

		/////////////////////////////////////////////
		// Validation
		//////////////////////////////////////////////

		// Required
		if (config.required && config.isEmpty(flatData[key])) {
			errors[key] = `Field ${config.name} is required`;
		}

		// Unique
		if ('unique' in config && config.unique && isCollection) {
			const query = { where: { [key]: { equals: flatData[key] } } };
			const existing = await adapter.collection.query({ slug, query });
			if (existing.length && existing[0].id !== documentId) {
				errors[key] = `Field ${flatData[key]} already exist`;
			}
		}

		/////////////////////////////////////////////
		// Transform before validate
		//////////////////////////////////////////////

		if (config.hooks?.beforeValidate) {
			if (flatData[key]) {
				for (const hook of config.hooks.beforeValidate) {
					flatData[key] = await hook(flatData[key], { config, api, locale });
				}
			}
		}

		/////////////////////////////////////////////
		// Validate
		//////////////////////////////////////////////

		if (config.validate && flatData[key]) {
			try {
				const valid = config.validate(flatData[key], {
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
				errors[key] = `Error in validate function`;
			}
		}

		/////////////////////////////////////////////
		// Transform to DB compliency
		//////////////////////////////////////////////

		if (config.hooks?.beforeSave) {
			if (flatData[key]) {
				for (const hook of config.hooks.beforeSave) {
					flatData[key] = await hook(flatData[key], { config, api, locale });
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

	return {
		errors: Object.keys(errors).length ? errors : null,
		validFlatData: flatData,
		validData: unflatten(flatData) as Partial<GenericDoc>
	};
};

type PreprocessFields = (args: {
	operation: 'update' | 'create';
	user: User | undefined;
	data: Partial<GenericDoc>;
	flatData: Dic;
	configMap: ConfigMap;
	locale: string | undefined;
	documentId: string | undefined;
	slug: PrototypeSlug;
	api: LocalAPI;
}) => Promise<{
	errors: FormErrors | null;
	validFlatData: Dic;
	validData: Partial<GenericDoc>;
}>;
