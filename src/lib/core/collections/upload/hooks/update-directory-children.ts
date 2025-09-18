import { RizomError } from '$lib/core/errors/index.js';
import { Hooks } from '$lib/core/operations/hooks/index.server.js';
import type { GenericDoc } from '$lib/core/types/doc.js';
import { trycatch } from '$lib/util/trycatch.js';
import { eq } from 'drizzle-orm';

type Update = { id: string; data: { parent: string } };

export const prepareDirectoryChildren = Hooks.beforeUpdate<'directory'>( async (args) => {
	let data = args.data;
	const { event, config, context } = args;
	const originalDoc = context.originalDoc

	if(!originalDoc) throw new RizomError(RizomError.OPERATION_ERROR, 'missing originalDoc @prepareDirectoryChildren')
		
	const db = event.locals.rizom.adapter.db;

	if (data.id) {
		const table = event.locals.rizom.adapter.getTable(config.slug);

		//@ts-ignore
		const children = await db.query[config.slug].findMany({
			where: eq(table.parent, `${originalDoc.id}`)
		});

		const updates = children.map((childDir: any) => {
			return {
				id: childDir.id,
				data: {
					id: `${childDir.parent.replace(originalDoc.id, data.id)}:${childDir.name}`
				}
			};
		});
		args.context.directoriesUpdates = updates;
	}

	return args;
});

export const updateDirectoryChildren = Hooks.afterUpdate<'directory'>( async (args) => {
	const { event, config } = args;
	const collection = event.locals.rizom.collection(config.slug);
	const updates: Update[] = args.context.directoriesUpdates || [];

	for (const update of updates) {
		const [error, _] = await trycatch(() => collection.updateById(update));
		if (error) {
			throw new RizomError(RizomError.OPERATION_ERROR, 'Error when updating child directories');
		}
	}

	return args;
});
