import { RizomError, RizomFormError } from 'rizom/errors';
import type { Context, Middleware } from '../../index.server';
import type { CompiledAreaConfig, CompiledCollectionConfig } from 'rizom/types/config';
import type { FormErrors, GenericDoc } from 'rizom/types';

type Validate = (ctx: Context) => Promise<{
	errors: FormErrors | null;
}>;

export const validateFields: Middleware<CompiledAreaConfig | CompiledCollectionConfig> = async (
	ctx,
	next
) => {
	const { errors } = await validate(ctx);
	if (errors) {
		throw new RizomFormError(errors);
	}
	await next();
};

const validate: Validate = async (ctx: Context) => {
	const errors: FormErrors = {};
	const { api, locale } = ctx;
	const { adapter } = api.rizom;
	const isCollection = api.rizom.config.getDocumentPrototype(ctx.config.slug);

	if (!ctx.internal.incomingFieldsResolver) throw new RizomError(RizomError.PIPE_ERROR);

	for (const [key, config] of Object.entries(ctx.internal.configMap || {})) {
		const field = ctx.internal.incomingFieldsResolver.useFieldServer(key);

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
		/** @TODO better unique check like relations, locale,...
		 *   possible to handle this with a try catch at DB operation
		 *   and parse the sqlite error ??
		 */
		if ('unique' in config && config.unique && isCollection) {
			const query = { where: { [key]: { equals: field.value } } };
			// const query = `where[${key}][equals]=${field.value}`;
			const existing = await adapter.collection.query({ slug: ctx.config.slug, query });
			if (ctx.original?.id && existing.length && existing[0].id !== ctx.original?.id) {
				errors[key] = RizomFormError.UNIQUE_FIELD;
			}
		}

		/////////////////////////////////////////////
		// Transform before validate
		//////////////////////////////////////////////

		if (config.hooks?.beforeValidate) {
			if (field.value) {
				for (const hook of config.hooks.beforeValidate) {
					field.value = await hook(field.value, { config, api, locale });
				}
			}
		}

		/////////////////////////////////////////////
		// Validate
		//////////////////////////////////////////////

		if (config.validate && field.value) {
			if (!isWriteOperation(ctx.operation)) throw new RizomError(RizomError.PIPE_ERROR);
			try {
				const valid = config.validate(field.value, {
					data: ctx.data as Partial<GenericDoc>,
					operation: ctx.operation!,
					id: ctx.original?.id,
					user: ctx.event.locals.user,
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
					field.value = await hook(field.value, { config, api, locale });
				}
			}
		}

		/////////////////////////////////////////////
		// Access
		//////////////////////////////////////////////

		if (config.access && config.access.update && ctx.operation === 'update') {
			const authorizedFieldUpdate = config.access.update(ctx.event.locals.user, {
				id: ctx.original?.id
			});
			if (!authorizedFieldUpdate) {
				field.delete();
			}
		}

		if (config.access && config.access.create && ctx.operation === 'create') {
			const authorizedFieldCreate = config.access.create(ctx.event.locals.user, {
				id: undefined
			});
			if (!authorizedFieldCreate) {
				field.delete();
			}
		}
	}

	return {
		errors: Object.keys(errors).length ? errors : null
	};
};

function isWriteOperation(
	operation: 'create' | 'read' | 'update' | 'delete'
): operation is 'create' | 'update' {
	return ['create', 'update'].includes(operation);
}
