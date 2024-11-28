import { toPascalCase } from '$lib/utils/string.js';
import type { Dic } from 'rizom/types/utility.js';
import {
	templateRelationFieldsTable,
	templateRelationMany,
	templateRelationOne
} from './templates.js';
const p = toPascalCase;

export const buildRelations = ({ relationsDic }: RowsRelationsArgs): RowsRelationsR => {
	if (Object.keys(relationsDic).length === 0) return { relations: '', relationsNames: [] };
	const relationsNames: string[] = [];

	let toOnes: string[] = [];
	const toManies: string[] = [];

	for (const [table, many] of Object.entries(relationsDic)) {
		toOnes = [
			...toOnes,
			...many.map((t) => {
				const name = `rel_${t}HasOne${p(table)}`;
				relationsNames.push(name);
				return templateRelationOne({ name, table: t, parent: table });
			})
		];
		const name = `rel_${table}HasMany`;
		relationsNames.push(name);
		toManies.push(templateRelationMany({ name, table, many }));
	}

	return {
		relations: [...toOnes, ...toManies].join('\n\n'),
		relationsNames
	};
};

export const buildFieldsRelations = (
	table: string,
	relationFieldsDic: Dic,
	hasLocale: boolean
): FieldsRelationsR => {
	let fieldsRelationContent = '';
	const relationName = `rel_${table}Rels`;
	const tablesRelationsTo = [...new Set(Object.values(relationFieldsDic).map((r) => r.to))];
	if (tablesRelationsTo.length) {
		fieldsRelationContent = [
			templateRelationFieldsTable({ table, relations: tablesRelationsTo, hasLocale }),
			templateRelationMany({ name: relationName, table, many: tablesRelationsTo })
			// templateExportRelationsFieldsToTable(table, relationFieldsDic)
		].join('\n');
	}
	return {
		fieldsRelationContent,
		tableName: `${table}Rels`
	};
};

type RowsRelationsR = {
	relations: string;
	relationsNames: string[];
};

type RowsRelationsArgs = {
	table: string;
	relationsDic: Record<string, string[]>;
};

type FieldsRelationsR = {
	fieldsRelationContent: string;
	tableName: string;
};
