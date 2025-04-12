import { omit } from '../util/object.js';
import { and, eq, getTableColumns } from 'drizzle-orm';
import { generatePK } from './util.js';
import { toPascalCase } from '../util/string.js';
import type { TreeBlock, PrototypeSlug } from 'rizom/types/doc.js';
import type { GenericAdapterInterfaceArgs } from 'rizom/types/adapter.js';
import type { WithRequired } from 'rizom/types/util.js';
import { extractFieldName } from 'rizom/fields/tree/util.js';
import { transformDataToSchema } from '../util/path.js';

const createAdapterTreeInterface = ({ db, tables }: GenericAdapterInterfaceArgs) => {
    //
    type KeyOfTables = keyof typeof tables;

    const buildBlockTableName = (slug: string, blockPath: string) => {
        const [fieldName] = extractFieldName(blockPath);
        return `${slug}Tree${toPascalCase(fieldName)}`;
    };

    const update: UpdateBlock = async ({ parentSlug, block, locale }) => {
        const tableName = buildBlockTableName(parentSlug, block.path);
        const columns = getTableColumns(tables[tableName]);
        const values = transformDataToSchema(omit(['id'], block), columns);

        if (Object.keys(values).length) {
            await db.update(tables[tableName]).set(values).where(eq(tables[tableName].id, block.id));
        }

        const keyTableLocales = `${tableName}Locales` as KeyOfTables;
        if (locale && keyTableLocales in tables) {
            const tableLocales = tables[keyTableLocales];
            const localizedColumns = getTableColumns(tableLocales);
            const localizedValues = transformDataToSchema(omit(['parentId', 'id'], block), localizedColumns);

            if (!Object.keys(localizedValues).length) return true;

            //@ts-expect-error keyTableLocales is key of db.query
            const localizedRow = await db.query[keyTableLocales].findFirst({
                where: and(eq(tableLocales.parentId, block.id), eq(tableLocales.locale, locale))
            });

            if (!localizedRow) {
                await db.insert(tableLocales).values({
                    ...localizedValues,
                    id: generatePK(),
                    locale: locale,
                    parentId: block.id
                });
            } else {
                await db
                    .update(tableLocales)
                    .set(localizedValues)
                    .where(and(eq(tableLocales.parentId, block.id), eq(tableLocales.locale, locale)));
            }
        }
        return true;
    };

    const deleteBlock: DeleteBlock = async ({ parentSlug, block }) => {
        const table = buildBlockTableName(parentSlug, block.path);
        await db.delete(tables[table]).where(eq(tables[table].id, block.id));
        return true;
    };

    const create: CreateBlock = async ({ parentSlug, block, parentId, locale }) => {
        const table = buildBlockTableName(parentSlug, block.path);
        const blockId = generatePK();
        const tableLocales = `${table}Locales`;

        if (locale && tableLocales in tables) {
            const unlocalizedColumns = getTableColumns(tables[table]);
            const localizedColumns = getTableColumns(tables[tableLocales]);

            const unlocalizedData = transformDataToSchema(block, unlocalizedColumns);
            const localizedData = transformDataToSchema(block, localizedColumns);

            await db.insert(tables[table]).values({
                ...unlocalizedData,
                id: blockId,
                parentId: parentId,
                locale
            });

            await db.insert(tables[tableLocales]).values({
                ...localizedData,
                id: generatePK(),
                parentId: blockId,
                locale
            });
        } else {
            const columns = getTableColumns(tables[table]);
            const schemaData = transformDataToSchema(block, columns);

            await db.insert(tables[table]).values({
                ...schemaData,
                parentId,
                id: generatePK()
            });
        }
        return true;
    };

    const getBlocksTableNames = (slug: string): string[] =>
        Object.keys(tables).filter((key) => key.startsWith(`${slug}Tree`) && !key.endsWith('Locales'));

    return {
        getBlocksTableNames,
        delete: deleteBlock,
        create,
        update
    };
};

export default createAdapterTreeInterface;

export type AdapterTreeInterface = ReturnType<typeof createAdapterTreeInterface>;

//////////////////////////////////////////////
// Types
//////////////////////////////////////////////

type UpdateBlock = (args: {
    parentSlug: PrototypeSlug;
    block: WithRequired<TreeBlock, 'path'>;
    locale?: string;
}) => Promise<boolean>;

type CreateBlock = (args: {
    parentSlug: PrototypeSlug;
    block: WithRequired<TreeBlock, 'path'>;
    parentId: string;
    locale?: string;
}) => Promise<boolean>;

type DeleteBlock = (args: {
    parentSlug: PrototypeSlug;
    block: WithRequired<TreeBlock, 'path'>;
}) => Promise<boolean>;
