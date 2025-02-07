import { error, type RequestEvent } from '@sveltejs/kit';
import { usersFields } from '$lib/collection/auth/usersFields.js';
import { buildConfigMap } from '../preprocess/config/map.js';
import { extractBlocks } from '../preprocess/blocks/extract.server.js';
import { extractRelations } from '../preprocess/relations/extract.server';
import { safeFlattenDoc } from '../../utils/doc.js';
import rizom from '$lib/rizom.server.js';
import { preprocessFields } from '../preprocess/fields.server';
import type { Adapter } from 'rizom/types/adapter.js';
import type { LocalAPI } from 'rizom/types/api.js';
import type { GenericDoc } from 'rizom/types/doc.js';
import type { CompiledCollectionConfig } from 'rizom/types/config.js';
import type { CollectionHookBeforeUpdateArgs } from 'rizom/types/hooks.js';
import type { Dic } from 'rizom/types/utility.js';
import { defineRelationsDiff } from '../preprocess/relations/diff.server.js';
import { RizomError, RizomFormError } from 'rizom/errors/index.js';
import { defineBlocksDiff } from '../preprocess/blocks/diff.server.js';

type Args<T extends GenericDoc = GenericDoc> = {
	id: string;
	data: Partial<T>;
	locale?: string | undefined;
	config: CompiledCollectionConfig;
	event: RequestEvent;
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
		const authorized = config.access.update(event.locals.user, { id });
		if (!authorized) {
			throw new RizomError(RizomError.UNAUTHORIZED);
		}
	}

	const originalDoc = await api.collection(config.slug).findById({ id, locale });

	if (!originalDoc) {
		throw new RizomError(RizomError.NOT_FOUND);
	}

	/** Flatten data once for all */
	let flatData: Dic = safeFlattenDoc(data);

	/** Add Password and ConfirmPassword Configs for Auth collections so validation includes these fields */
	const fields = config.fields;
	if (config.auth) {
		fields.push(usersFields.password.raw, usersFields.confirmPassword.raw);
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
		api
	});

	if (errors) {
		throw new RizomFormError(errors);
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
				throw new RizomError(RizomError.HOOK, err.message);
			}
		}
	}

	//////////////////////////////////////////////
	// Update data
	//////////////////////////////////////////////

	const newBlocks = extractBlocks({
		doc: data,
		configMap
	});

	await adapter.collection.update({ slug: config.slug, id, data, locale });

	const existingBlocks = extractBlocks({
		doc: originalDoc,
		configMap
	});

	const blocksDiff = defineBlocksDiff({
		existingBlocks,
		newBlocks
	});

	if (blocksDiff.toDelete.length) {
		await Promise.all(
			blocksDiff.toDelete.map((block) => adapter.blocks.delete({ parentSlug: config.slug, block }))
		);
	}

	if (blocksDiff.toAdd.length) {
		await Promise.all(
			blocksDiff.toAdd.map((block) =>
				adapter.blocks.create({ parentSlug: config.slug, parentId: originalDoc.id, block, locale })
			)
		);
	}

	if (blocksDiff.toUpdate.length) {
		await Promise.all(
			blocksDiff.toUpdate.map((block) =>
				adapter.blocks.update({ parentSlug: config.slug, block, locale })
			)
		);
	}

	/** Delete relations from deletedBlocks */
	await adapter.relations.deleteFromPaths({
		parentSlug: config.slug,
		parentId: id,
		paths: blocksDiff.toDelete.map((block) => `${block.path}.${block.position}`)
	});

	/** Get existing relations */
	const existingRelations = await adapter.relations.getAll({
		parentSlug: config.slug,
		parentId: id,
		locale
	});

	/** Get relations in data */
	const extractedRelations = extractRelations({ parentId: id, flatData, configMap, locale });

	/** get difference between them */
	const relationsDiff = defineRelationsDiff({
		existingRelations,
		extractedRelations,
		locale
	});

	if (relationsDiff.toDelete.length) {
		await adapter.relations.delete({
			parentSlug: config.slug,
			relations: relationsDiff.toDelete
		});
	}

	if (relationsDiff.toUpdate.length) {
		await adapter.relations.update({
			parentSlug: config.slug,
			relations: relationsDiff.toUpdate
		});
	}

	if (relationsDiff.toAdd.length) {
		await adapter.relations.create({
			parentSlug: config.slug,
			parentId: id,
			relations: relationsDiff.toAdd
		});
	}

	const rawDoc = (await adapter.collection.findById({ slug: config.slug, id, locale })) as T;

	if (!rawDoc) {
		throw new RizomError(RizomError.NOT_FOUND);
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
