import { error, type RequestEvent } from '@sveltejs/kit';
import { usersFields } from '$lib/auth/usersFields.js';
import { buildConfigMap } from '../preprocess/config/map.js';
import { extractBlocks } from '../preprocess/extract/blocks.server.js';
import { extractRelations } from '../preprocess/extract/relations.server';
import { safeFlattenDoc } from '../../utils/doc.js';
import { RizomAccessError } from '../../errors/access.server.js';
import rizom from '$lib/rizom.server.js';
import { preprocessFields } from '../preprocess/fields.server';
import type { Adapter } from 'rizom/types/adapter.js';
import type { LocalAPI } from 'rizom/types/api.js';
import type { GenericDoc } from 'rizom/types/doc.js';
import type { BuiltCollectionConfig } from 'rizom/types/config.js';
import type { CollectionHookBeforeUpdateArgs } from 'rizom/types/hooks.js';
import { RizomHookError } from 'rizom/errors/hook.server.js';
import type { Dic } from 'rizom/types/utility.js';

type Args<T extends GenericDoc = GenericDoc> = {
	id: string;
	data: Partial<T>;
	locale?: string | undefined;
	config: BuiltCollectionConfig;
	event?: RequestEvent;
	api: LocalAPI;
	adapter: Adapter;
};

export const updateById = async <T extends GenericDoc = GenericDoc>({
	id,
	data,
	locale,
	config,
	api,
	event,
	adapter
}: Args<T>) => {
	//////////////////////////////////////////////
	// Access
	//////////////////////////////////////////////
	if (event) {
		const authorized = api.hasGrantedPrivilege || config.access.update(event.locals.user, { id });
		if (!authorized) {
			throw new RizomAccessError('- trying to update ' + config.slug);
		}
	}

	const originalDoc = await api.collection(config.slug).findById({ id, locale });

	if (!originalDoc) {
		return error(404);
	}

	/** Flatten data once for all */
	let flatData: Dic = safeFlattenDoc(data);

	/** Add Password and ConfirmPassword for Auth collections so validation includes these fields */
	const fields = config.fields;
	if (config.auth) {
		fields.push(usersFields.password, usersFields.confirmPassword);
	}

	const configMap = buildConfigMap(data, fields);

	const { errors, validData, validFlatData } = await preprocessFields({
		data,
		flatData,
		configMap,
		operation: 'update',
		documentId: id,
		user: event?.locals.user,
		slug: config.slug,
		locale,
		rizom
	});

	if (errors) {
		return { errors };
	} else {
		data = validData as T;
		flatData = validFlatData;
	}

	//////////////////////////////////////////////
	// Hooks BeforeUpdate
	//////////////////////////////////////////////

	if (config.hooks && config.hooks.beforeUpdate) {
		for (const hook of config.hooks.beforeUpdate) {
			try {
				const args = (await hook({
					operation: 'update',
					config,
					api,
					data,
					originalDoc,
					event,
					rizom
				})) as CollectionHookBeforeUpdateArgs<T>;
				data = args.data;
				event = args.event;
			} catch (err: any) {
				console.log(err);
				throw new RizomHookError(err.message);
			}
		}
	}

	//////////////////////////////////////////////
	// Update data
	//////////////////////////////////////////////

	const { blocks, paths: blocksPaths } = extractBlocks(data, configMap);
	const { relations } = extractRelations({ flatData, configMap, locale });

	await adapter.collection.update({ slug: config.slug, id, data, locale });

	/** Deleted blocks */

	const deletedBlocks = await adapter.blocks.deleteFromPaths({
		parentSlug: config.slug,
		parentId: id,
		paths: [...new Set(blocksPaths)]
	});

	/** Create blocks */
	for (const block of blocks) {
		adapter.blocks.createBlock({
			parentSlug: config.slug,
			parentId: id,
			block,
			locale
		});
	}

	/** Delete Localized Relations */
	await adapter.relations.deleteFromPaths({
		parentSlug: config.slug,
		parentId: id,
		paths: [
			...relations.map((relation) => relation.path).filter((path) => configMap[path].localized)
		],
		locale
	});

	/** Delete Unlocalized Relations & relations in Blocks */
	await adapter.relations.deleteFromPaths({
		parentSlug: config.slug,
		parentId: id,
		paths: [
			...deletedBlocks.map((block) => `${block.path}.${block.position}`),
			...relations.map((relation) => relation.path).filter((path) => !configMap[path].localized)
		]
	});

	/** Update Relations */
	await adapter.relations.updateOrCreate({
		parentSlug: config.slug,
		parentId: id,
		relations
	});

	const rawDoc = (await adapter.collection.findById({ slug: config.slug, id, locale })) as T;

	if (!rawDoc) {
		throw new Error('Database error');
	}

	const doc = await adapter.transform.doc<T>({
		doc: rawDoc,
		slug: config.slug,
		locale,
		event,
		api
	});

	return doc;
};
