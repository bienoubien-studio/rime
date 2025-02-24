import { usersFields } from '$lib/collection/auth/usersFields.js';
import { mergeWithBlankDocument } from '../preprocess/fill/index.js';
import { extractBlocks } from '../preprocess/blocks/extract.server.js';
import { extractRelations } from '../preprocess/relations/extract.server';
import rizom from '$lib/rizom.server.js';
import cloneDeep from 'clone-deep';
import type { RequestEvent } from '@sveltejs/kit';
import type { LocalAPI } from 'rizom/types/api';
import type { Adapter } from 'rizom/types/adapter';
import type { CollectionSlug, GenericDoc } from 'rizom/types/doc';
import type { CompiledCollectionConfig } from 'rizom/types/config';
import logger from 'rizom/utils/logger/index.js';
import type {
	CollectionHookAfterCreateArgs,
	CollectionHookBeforeCreateArgs
} from 'rizom/types/hooks.js';
import { RizomError, RizomFormError } from 'rizom/errors/index.js';
import type { RegisterCollection } from 'rizom';
import { extractTreeItems } from '../preprocess/tree/extract.server.js';
import { createFieldProvider } from '../preprocess/fields/provider.server.js';

export const create = async <T extends RegisterCollection[CollectionSlug]>({
	data,
	locale,
	config,
	event,
	api,
	adapter
}: Args<T>) => {
	//////////////////////////////////////////////
	// Access
	//////////////////////////////////////////////

	const authorized = config.access.create(event.locals.user);
	if (!authorized) {
		throw new RizomError(RizomError.UNAUTHORIZED);
	}

	const incomingData = cloneDeep(data);

	console.log('incomingData', incomingData);

	/** Add Password and ConfirmPassword so validation includes these fields */
	const fields = [...config.fields];
	if (config.auth) {
		fields.push(usersFields.password.raw, usersFields.confirmPassword.raw);
	}

	/** Complete with null values for fields that are not presents in incoming data */
	const dataMergedWithBlankDocument = mergeWithBlankDocument({ data, config });

	/** Create an object that provide a value and a config based on a path  */
	const fieldProvider = createFieldProvider({ data: dataMergedWithBlankDocument, fields });

	/** Add default values */
	await fieldProvider.completeWithDefault({ adapter });

	const { errors } = await fieldProvider.validate({
		operation: 'create',
		documentId: undefined,
		user: event.locals.user,
		slug: config.slug,
		locale,
		api
	});

	if (errors) {
		throw new RizomFormError(errors);
	}

	//////////////////////////////////////////////
	// Hooks BeforeCreate
	//////////////////////////////////////////////

	if (config.hooks && config.hooks.beforeCreate) {
		for (const hook of config.hooks.beforeCreate) {
			try {
				const args = (await hook({
					operation: 'create',
					config,
					data: fieldProvider.data,
					event,
					rizom,
					api
				})) as CollectionHookBeforeCreateArgs<T>;
				fieldProvider.data = args.data;
				event = args.event;
			} catch (err: any) {
				console.log(err);
				throw new RizomError(RizomError.HOOK, err.message);
			}
		}
	}

	//////////////////////////////////////////////
	// Create doc
	//////////////////////////////////////////////

	const treeItems = extractTreeItems({
		fieldProvider
	});

	const blocks = extractBlocks({ fieldProvider });
	const { relations } = extractRelations({ fieldProvider, locale });

	console.log('fieldProvider.data', data);
	console.log('extracted relations', relations);

	const createdId = await adapter.collection.insert({
		slug: config.slug,
		data: fieldProvider.data,
		locale
	});

	/** Create Relations */
	await adapter.relations.create({
		parentSlug: config.slug,
		parentId: createdId,
		relations
	});

	/** Create blocks */
	await Promise.all(
		blocks.map((block) =>
			adapter.blocks.create({
				parentSlug: config.slug,
				block,
				parentId: createdId,
				locale
			})
		)
	);

	/** Create tree blocks */
	await Promise.all(
		treeItems.map((block) =>
			adapter.tree.create({ parentSlug: config.slug, parentId: createdId, block, locale })
		)
	);

	const rawDoc = (await adapter.collection.findById({
		slug: config.slug,
		id: createdId,
		locale
	})) as T;

	if (!rawDoc) {
		throw new RizomError(RizomError.NOT_FOUND);
	}

	/** Easy way to fallback locale, TODO : find a better way */
	const locales = rizom.config.getLocalesCodes();
	if (locales.length) {
		if ('file' in incomingData) {
			delete incomingData.file;
		}
		if ('filename' in incomingData) {
			delete incomingData.filename;
		}
		const otherLocales = locales.filter((code) => code !== locale);
		for (const otherLocale of otherLocales) {
			logger.debug('Create fallback for ' + otherLocale);
			api.enforceLocale(otherLocale);
			await api
				.collection(config.slug)
				.updateById({ id: createdId, data: incomingData, locale: otherLocale });
		}
	}

	const doc = await adapter.transform.doc<T>({
		doc: rawDoc,
		slug: config.slug,
		locale,
		event,
		api
	});

	//////////////////////////////////////////////
	// Hooks AfterCreate
	//////////////////////////////////////////////

	if (config.hooks && config.hooks.afterCreate) {
		for (const hook of config.hooks.afterCreate) {
			try {
				const args = (await hook({
					operation: 'create',
					config,
					doc,
					event,
					rizom,
					api
				})) as CollectionHookAfterCreateArgs<T>;
				event = args.event;
			} catch (err: any) {
				throw new RizomError(RizomError.HOOK, err.message);
			}
		}
	}

	return { doc };
};

type Args<T extends GenericDoc = GenericDoc> = {
	data: Partial<T>;
	locale?: string | undefined;
	config: CompiledCollectionConfig;
	api: LocalAPI;
	event: RequestEvent & {
		locals: App.Locals;
	};
	adapter: Adapter;
};

// { doc: CMS.GenericDoc; errors?: never } | { doc?: never; errors: CMS.FormErrors }
