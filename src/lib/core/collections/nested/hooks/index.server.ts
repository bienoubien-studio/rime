import type { GenericDoc } from '$lib/core/types/doc.js';
import type { HookBeforeRead } from '$lib/core/config/types/hooks.js';
import { asc, eq } from 'drizzle-orm';

/**
 * Hook to populate _children property on document from a nested collection
 */
export const addChildrenProperty: HookBeforeRead<'collection', GenericDoc> = async (args) => {
	const select = args.metas.select && Array.isArray(args.metas.select) ? args.metas.select : [];
	const emptySelect = select.length === 0;

	// If there is a select param do not populate _children just return args
	if (!emptySelect && !select.includes('_children')) return args;

	// Else populate _children
	const { rizom } = args.event.locals;
	const tableName = args.config.slug;
	const table = rizom.adapter.tables[tableName];

	//@ts-ignore
	const children = await rizom.adapter.db.query[tableName].findMany({
		where: eq(table._parent, args.doc.id),
		orderBy: [asc(table._position)],
		columns: {
			id: true
		}
	});

	args.doc = {
		...args.doc,
		_children: children.map((c: any) => c.id) || []
	};

	return args;
};
