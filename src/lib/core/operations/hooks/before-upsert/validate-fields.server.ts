import { RizomError, RizomFormError } from '$lib/core/errors/index.js';
import { deleteValueAtPath, getValueAtPath, setValueAtPath } from '$lib/util/object';
import { logger } from '$lib/core/logger/index.server';
import type { GenericDoc } from '$lib/core/types/doc.js';
import type { FormErrors } from '$lib/panel/types.js';
import type { Prototype } from '../../../../types.js';
import type { HookBeforeUpsert } from '$lib/core/config/types/index.js';

export const validateFields: HookBeforeUpsert<Prototype, GenericDoc> = async (args) => {
	const errors: FormErrors = {};
	const { event, operation, rizom } = args;
	const { user } = event.locals;
	const configMap = args.context.configMap;
	const locale = args.context.params.locale || args.event.locals.locale;
	const slug = args.config.slug;
	const isCollection = rizom.config.isCollection(slug);

	let output = { ...args.data };

	if (!configMap) throw new RizomError(RizomError.OPERATION_ERROR, 'missing configMap @validateFields');

  // Skip validation on locale fallback as the validation has already been done on creation
  if(args.context.isFallbackLocale) return args
		
	for (const [key, config] of Object.entries(configMap)) {
		let value: any = getValueAtPath(key, output);

		/****************************************************/
		/* Validation
    /****************************************************/

		
		// Unique
		/** @TODO better unique check like relations, locale,... */
		if ('unique' in config && config.unique && isCollection) {
			let query;
			switch (operation) {
				case 'create':
					query = `where[${key}][equals]=${value}`;
					break;
				case 'update':
					if (!args.context.originalDoc)
						throw new RizomError(RizomError.OPERATION_ERROR, 'missing originalDoc @validateFields');
					query = `where[and][0][${key}][equals]=${value}&where[and][1][id][not_equals]=${args.context.originalDoc.id}&select=id`;
			}
			
			const existing = await rizom.collection(slug).system().find({ locale, query, select: ['id'] });
			
			if (existing.length) {
				errors[key] = RizomFormError.UNIQUE_FIELD;
			}
		}

		

		/****************************************************/
		/* Field hook before validate
    /****************************************************/

		if (config.hooks?.beforeValidate) {
			if (value) {
				for (const hook of config.hooks.beforeValidate) {
					value = await hook(value, { config, event });
					output = setValueAtPath(key, output, value);
				}
			}
		}
		
		/****************************************************/
		/* Validate
    /****************************************************/

		if (config.validate && value) {
			try {
				const valid = config.validate(value, {
					data: output as Partial<GenericDoc>,
					operation,
					id: operation === 'update' ? args.context.originalDoc?.id : undefined,
					user: user,
					locale,
					config
				});
				if (valid !== true) {
					errors[key] = valid;
				}
			} catch {
				logger.warn(`Error while validating field ${key}`);
				errors[key] = RizomFormError.VALIDATION_ERROR;
			}
		}

		/****************************************************/
		/* Field hook before Save
    /****************************************************/

		if (config.hooks?.beforeSave) {
			if (value) {
				for (const hook of config.hooks.beforeSave) {
					value = await hook(value, { config, event });
					output = setValueAtPath(key, output, value);
				}
			}
		}

		/****************************************************/
		/* Access
    /****************************************************/


		if (config.access && config.access.update && operation === 'update') {
			const authorizedFieldUpdate = config.access.update(user, {
				id: args.context.originalDoc?.id
			});
			if (!authorizedFieldUpdate) {
        output = deleteValueAtPath(output, key);
        value = undefined;
			}
		}

		
		if (config.access && config.access.create && operation === 'create') {
			const authorizedFieldCreate = config.access.create(user, {
				id: undefined
			});
			if (!authorizedFieldCreate) {
				output = deleteValueAtPath(output, key);
        value = undefined;
			}
		}
		
		// Required
		if (config.required && config.isEmpty(value)) {
			errors[key] = RizomFormError.REQUIRED_FIELD;
		}
		
	}
	

	if (Object.keys(errors).length) {
		throw new RizomFormError(errors);
	}

	return {
		...args,
		data: output
	};
};
