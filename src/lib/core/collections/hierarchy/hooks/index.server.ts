import type { GenericDoc } from '$lib/core/types/doc.js';
import type { CollectionHookBeforeRead } from '$lib/core/config/types/hooks.js';
import { makeVersionsSlug } from '$lib/util/schema.js';
import { asc, eq } from 'drizzle-orm';

export const addChildrenProperty: CollectionHookBeforeRead<GenericDoc> = async (args) => {
  
  const { rizom } = args.event.locals
  
  const tableName = args.config.slug
  const table = rizom.adapter.tables[tableName]
  
  //@ts-ignore
  const children = await rizom.adapter.db.query[tableName].findMany({
    where: eq(table._parent, args.doc.id),
    orderBy: [asc(table._position)],
    columns: {
      id: true
    }
  })

  args.doc = {
    ...args.doc,
    _children: children.map((c:any) => c.id) || []
  }
  
  return args
};
