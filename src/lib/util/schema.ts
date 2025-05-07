export const getTreeTableNames = (slug: string, tables: Record<string, any>): string[] =>
	Object.keys(tables).filter((key) => key.startsWith(`${slug}Tree`) && !key.endsWith('Locales'));

export const getBlocksTableNames = (slug: string, tables: Record<string, any>): string[] =>
	Object.keys(tables).filter((key) => key.startsWith(`${slug}Blocks`) && !key.endsWith('Locales'));
