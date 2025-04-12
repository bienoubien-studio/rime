import { omit } from '../util/object.js';
import { and, eq, getTableColumns } from 'drizzle-orm';
import { generatePK } from './util.js';
import { toPascalCase } from '../util/string.js';
import type { GenericBlock, PrototypeSlug } from 'rizom/types/doc.js';
import type { GenericAdapterInterfaceArgs } from 'rizom/types/adapter.js';
import { transformDataToSchema } from '../util/path.js';

const createAdapterBlocksInterface = ({ db, tables }: GenericAdapterInterfaceArgs) => {
    //
    type KeyOfTables = keyof typeof tables;

    const buildBlockTableName = (slug: string, blockName: string) =>
        `${slug}Blocks${toPascalCase(blockName)}`;

    const update: UpdateBlock = async ({ parentSlug, block, locale }) => {
        const table = buildBlockTableName(parentSlug, block.type);
        const columns = getTableColumns(tables[table]);
        const values = transformDataToSchema(omit(['id'], block), columns);

        if (Object.keys(values).length) {
            await db.update(tables[table]).set(values).where(eq(tables[table].id, block.id));
        }

        const keyTableLocales = `${table}Locales` as KeyOfTables;
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
        const table = buildBlockTableName(parentSlug, block.type);
        await db.delete(tables[table]).where(eq(tables[table].id, block.id));
        return true;
    };

    const create: CreateBlock = async ({ parentSlug, block, parentId, locale }) => {
        const tableName = buildBlockTableName(parentSlug, block.type);
        const blockId = generatePK();
        const tableNameLocales = `${tableName}Locales`;

        if (locale && tableNameLocales in tables) {
            const unlocalizedColumns = getTableColumns(tables[tableName]);
            const localizedColumns = getTableColumns(tables[tableNameLocales]);

            const unlocalizedData = transformDataToSchema(block, unlocalizedColumns);
            const localizedData = transformDataToSchema(block, localizedColumns);

            await db.insert(tables[tableName]).values({
                ...unlocalizedData,
                id: blockId,
                parentId: parentId,
                locale
            });

            await db.insert(tables[tableNameLocales]).values({
                ...localizedData,
                id: generatePK(),
                parentId: blockId,
                locale
            });
        } else {
            const columns = getTableColumns(tables[tableName]);
            const schemaData = transformDataToSchema(block, columns);

            await db.insert(tables[tableName]).values({
                ...schemaData,
                parentId,
                id: generatePK()
            });
        }
        return true;
    };

    const getBlocksTableNames = (slug: string): string[] =>
        Object.keys(tables).filter(
            (key) => key.startsWith(`${slug}Blocks`) && !key.endsWith('Locales')
        );

    return {
        getBlocksTableNames,
        delete: deleteBlock,
        create,
        update
    };
};

export default createAdapterBlocksInterface;

export type AdapterBlocksInterface = ReturnType<typeof createAdapterBlocksInterface>;

//////////////////////////////////////////////
// Types
//////////////////////////////////////////////

type UpdateBlock = (args: {
    parentSlug: PrototypeSlug;
    block: GenericBlock;
    locale?: string;
}) => Promise<boolean>;

type CreateBlock = (args: {
    parentSlug: PrototypeSlug;
    block: GenericBlock;
    parentId: string;
    locale?: string;
}) => Promise<boolean>;

type DeleteBlock = (args: { parentSlug: PrototypeSlug; block: GenericBlock }) => Promise<boolean>;
