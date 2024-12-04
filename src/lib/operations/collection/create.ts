import deepmerge from 'deepmerge';
import { usersFields } from '$lib/collection/auth/usersFields.js';
import { addDefaultValues } from '../preprocess/fill/index.js';
import { buildConfigMap } from '../preprocess/config/map.js';
import { extractBlocks } from '../preprocess/extract/blocks.server';
import { extractRelations } from '../preprocess/relations/extract.server';
import { makeEmptyDoc, safeFlattenDoc } from '../../utils/doc.js';
import { RizomAccessError } from '../../errors/access.server.js';
import { isUploadConfig } from '../../config/utils.js';
import rizom from '$lib/rizom.server.js';
import { preprocessFields } from '../preprocess/fields.server.js';
import cloneDeep from 'clone-deep';
import type { RequestEvent } from '@sveltejs/kit';
import type { LocalAPI } from 'rizom/types/api';
import type { Adapter } from 'rizom/types/adapter';
import type { GenericDoc } from 'rizom/types/doc';
import type { BuiltCollectionConfig } from 'rizom/types/config';
import { RizomHookError } from 'rizom/errors/hook.server.js';
import logger from 'rizom/utils/logger/index.js';
import type {
	CollectionHookAfterCreateArgs,
	CollectionHookBeforeCreateArgs
} from 'rizom/types/hooks.js';
import type { Dic } from 'rizom/types/utility.js';

export const create = async <T extends GenericDoc = GenericDoc>({
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

	if (event) {
		const authorized = api.hasGrantedPrivilege || config.access.create(event.locals.user);
		if (!authorized) {
			throw new RizomAccessError('- trying to create ' + config.slug);
		}
	}

	const incomingData = cloneDeep(data);

	/** Add Password and ConfirmPassword so validation includes these fields */
	const fields = [...config.fields];
	if (config.auth) {
		fields.push(usersFields.password, usersFields.confirmPassword);
	}

	// extract file before merge
	let file;
	if (isUploadConfig(config) && 'file' in data) {
		file = data.file;
		delete data.file;
	}

	/** Merge data with emptydoc so all required fields will be present in validate */
	const dataWithEmptyFields = deepmerge<GenericDoc>(
		makeEmptyDoc({
			...config,
			fields
		}),
		data
	);

	if (file) {
		dataWithEmptyFields.file = file;
	}

	// logger.info(flatData);
	/** Build map between path in data and coresponding config */
	const configMap = buildConfigMap(dataWithEmptyFields, fields);

	const dataWithDefaultValues = await addDefaultValues({
		data: dataWithEmptyFields,
		configMap,
		adapter
	});

	/** Flatten data once for all */
	let flatData: Dic = safeFlattenDoc(dataWithDefaultValues);

	/** Validate */
	const { errors, validData, validFlatData } = await preprocessFields({
		data,
		flatData,
		configMap,
		operation: 'create',
		documentId: undefined,
		user: event?.locals.user,
		slug: config.slug,
		locale,
		api
	});

	if (errors) {
		return { errors };
	} else {
		data = validData as T;
		flatData = validFlatData;
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
					data,
					event,
					rizom,
					api
				})) as CollectionHookBeforeCreateArgs<T>;
				data = args.data;
				event = args.event;
			} catch (err: any) {
				console.log(err);
				throw new RizomHookError(err.message);
			}
		}
	}

	//////////////////////////////////////////////
	// Create doc
	//////////////////////////////////////////////

	const { blocks } = extractBlocks(data, configMap);
	const { relations } = extractRelations({ flatData, configMap, locale });

	const createdId = await adapter.collection.insert({
		slug: config.slug,
		data,
		locale
	});

	/** Update Relations */
	await adapter.relations.create({
		parentSlug: config.slug,
		parentId: createdId,
		relations
	});

	/** Create blocks */
	for (const block of blocks) {
		await adapter.blocks.createBlock({
			parentSlug: config.slug,
			block: { ...block },
			parentId: createdId,
			locale
		});
	}

	const rawDoc = (await adapter.collection.findById({
		slug: config.slug,
		id: createdId,
		locale
	})) as T;

	if (!rawDoc) {
		throw new Error('Database error');
	}

	/** Easy way to fallback locale, TODO : find a better way */
	const locales = rizom.config.getLocalesCodes();
	if (locales.length) {
		if ('file' in incomingData) {
			delete incomingData.file;
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
					data,
					event,
					rizom,
					api
				})) as CollectionHookAfterCreateArgs<T>;
				event = args.event;
			} catch (err: any) {
				throw new RizomHookError(err.message);
			}
		}
	}

	return { doc };
};

type Args<T extends GenericDoc = GenericDoc> = {
	data: Partial<T>;
	locale?: string | undefined;
	config: BuiltCollectionConfig;
	api: LocalAPI;
	event?: RequestEvent & {
		locals: App.Locals;
	};
	adapter: Adapter;
};

// { doc: CMS.GenericDoc; errors?: never } | { doc?: never; errors: CMS.FormErrors }
