import { error, type RequestEvent } from '@sveltejs/kit';
import { usersFields } from '$lib/collection/auth/usersFields.js';
import { buildConfigMap } from '../preprocess/config/map.js';
import { extractBlocks } from '../preprocess/extract/blocks.server.js';
import { extractRelations } from '../preprocess/relations/extract.server';
import { safeFlattenDoc } from '../../utils/doc.js';
import { RizomAccessError } from '../../errors/access.server.js';
import rizom from '$lib/rizom.server.js';
import { preprocessFields } from '../preprocess/fields.server';
import type { Adapter } from 'rizom/types/adapter.js';
import type { LocalAPI } from 'rizom/types/api.js';
import type { GenericDoc } from 'rizom/types/doc.js';
import type { CompiledCollectionConfig } from 'rizom/types/config.js';
import type { CollectionHookBeforeUpdateArgs } from 'rizom/types/hooks.js';
import { RizomHookError } from 'rizom/errors/hook.server.js';
import type { Dic } from 'rizom/types/utility.js';

import { defineRelationsDiff } from '../preprocess/relations/diff.server.js';

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
			throw new RizomAccessError('- trying to update ' + config.slug);
		}
	}

	const originalDoc = await api.collection(config.slug).findById({ id, locale });

	if (!originalDoc) {
		return error(404);
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

	await adapter.collection.update({ slug: config.slug, id, data, locale });

	/** Deleted blocks */
	const deletedBlocks = await adapter.blocks.deleteFromPaths({
		parentSlug: config.slug,
		parentId: id,
		paths: [...new Set(blocksPaths)]
	});

	// Delete relations in deleted blocks
	await adapter.relations.deleteFromPaths({
		parentSlug: config.slug,
		parentId: id,
		paths: deletedBlocks.map((block) => `${block.path}.${block.position}`)
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

	// const existingRelations = await adapter.relations.getAll({
	// 	parentSlug: config.slug,
	// 	parentId: id,
	// 	locale
	// });

	// // Group existing relations by path
	// const existingByPath = existingRelations.reduce(
	// 	(acc, rel) => {
	// 		if (!acc[rel.path]) acc[rel.path] = [];
	// 		acc[rel.path].push(rel);
	// 		return acc;
	// 	},
	// 	{} as Record<string, Relation[]>
	// );

	// // Group new relations by path
	// const newRelationsByPath = relations.reduce(
	// 	(acc, rel) => {
	// 		if (!acc[rel.path]) acc[rel.path] = [];
	// 		acc[rel.path].push(rel);
	// 		return acc;
	// 	},
	// 	{} as Record<string, Relation[]>
	// );

	// // Relations to delete
	// const relationsToDelete = existingRelations.filter((rel) => {
	// 	// If relation is localized and doesn't match current locale, keep it
	// 	if (rel.locale && rel.locale !== locale) {
	// 		return false;
	// 	}

	// 	return (
	// 		emptyPaths.includes(rel.path) ||
	// 		deletedBlocks.some((block) => rel.path.startsWith(`${block.path}.${block.position}`)) ||
	// 		(newRelationsByPath[rel.path] &&
	// 			!newRelationsByPath[rel.path].some((newRel) => {
	// 				// Get the correct ID field based on relationTo
	// 				const existingIdField = `${newRel.relationTo}Id`;
	// 				return rel[existingIdField as keyof typeof rel] === newRel.relationId;
	// 			}))
	// 	);
	// });

	// console.log('Existing relations:', existingRelations);
	// console.debug('New relations by path:', newRelationsByPath);
	// console.debug('Relations to delete:', relationsToDelete);

	// // Delete relations
	// if (relationsToDelete.length > 0) {
	// 	await adapter.relations.deleteFromPaths({
	// 		parentSlug: config.slug,
	// 		parentId: id,
	// 		paths: [...new Set(relationsToDelete.map((rel) => rel.path))]
	// 	});
	// }

	/** Update Relations */
	// await adapter.relations.updateOrCreate({
	// 	parentSlug: config.slug,
	// 	parentId: id,
	// 	relations
	// });

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
