import { unflatten } from 'flat';
import {
	isComboBoxField,
	isDateField,
	isEmptyValue,
	isRadioField,
	isRichTextField,
	isSelectField
} from '$lib/utils/field.js';
import { RizomError } from '$lib/errors/error.server.js';
import type { Rizom } from '$lib/rizom.server.js';
import type { ConfigMap } from './config/map.js';
import type { User } from 'rizom/types/auth.js';
import type { GenericDoc, PrototypeSlug } from 'rizom/types/doc.js';
import type { FormErrors } from 'rizom/types/panel.js';
import type { Dic } from 'rizom/types/utility.js';

export const preprocessFields: PreprocessFields = async ({
	data,
	flatData,
	configMap,
	operation,
	documentId,
	user,
	slug,
	locale,
	rizom
}) => {
	const errors: FormErrors = {};
	const { adapter } = rizom;
	const isCollection = rizom.config.getDocumentPrototype(slug);

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
		if (config.required && isEmptyValue(flatData[key], config.type)) {
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

		// convert date string to data
		if (isDateField(config)) {
			const value = flatData[key];
			if (value) {
				flatData[key] = new Date(value);
			}
		}

		/////////////////////////////////////////////
		// Validate
		//////////////////////////////////////////////

		// Validate Select/Combo/Radio fields
		// Not validate in a field.validate function as we need the config here,
		// TODO probably in a future, pass the config.options in validation metas
		if (isSelectField(config) || isComboBoxField(config) || isRadioField(config)) {
			const selected = flatData[key];
			const validValues = config.options.map((o) => o.value);
			if (selected && Array.isArray(selected)) {
				for (const value of selected) {
					if (!validValues.includes(value)) {
						errors[key] = `${key} field : value should be one of these : ${validValues.join('|')}`;
					}
				}
			} else if (selected !== undefined) {
				if (!validValues.includes(selected)) {
					errors[key] = `${key} field : value should be one of these : ${validValues.join('|')}`;
				}
			}
		}

		// Validate
		if (config.validate) {
			try {
				const valid = config.validate(flatData[key], {
					data,
					operation,
					id: documentId,
					user,
					locale
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

		// convert JSON to string
		if (isRichTextField(config)) {
			const value = flatData[key];
			if (value) {
				flatData[key] = JSON.stringify(value);
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
	rizom: Rizom;
}) => Promise<{
	errors: FormErrors | null;
	validFlatData: Dic;
	validData: Partial<GenericDoc>;
}>;
