import { and, or, eq, getTableColumns, inArray } from 'drizzle-orm';
import * as drizzleORM from 'drizzle-orm';
import qs, { type ParsedQs } from 'qs';
import { rizom } from '$lib/index.js';
import type { PrototypeSlug } from 'rizom/types/doc.js';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { Dic } from '../types/util';

import { RizomError } from '../errors/index.js';
import { isObjectLiteral } from '../util/object';
import type { OperationQuery } from '../types';
import { rizom } from 'rizom';
import logger from 'rizom/util/logger';
import { isRelationField } from 'rizom/util/field';

type BuildWhereArgs = {
	query: OperationQuery | string;
	slug: PrototypeSlug;
	locale?: string;
	db: BetterSQLite3Database<any>;
};

export const buildWhereParam = ({ query: incomingQuery, slug, db, locale }: BuildWhereArgs) => {
	let query: OperationQuery;

	if (typeof incomingQuery === 'string') {
		try {
			query = qs.parse(incomingQuery);
		} catch (err: any) {
			throw new RizomError('1 Unable to parse given query ' + err.message);
		}
	} else {
		if (!isObjectLiteral(incomingQuery)) {
			throw new RizomError('2 Unable to parse given query');
		}
		query = incomingQuery;
	}

	if (!query.where) {
		return false;
	}

	const table = rizom.adapter.tables[slug];
	const tableNameLocales = `${slug}Locales`;
	const tableLocales = rizom.adapter.tables[tableNameLocales];
	const localizedColumns =
		locale && tableNameLocales in rizom.adapter.tables
			? Object.keys(getTableColumns(tableLocales))
			: [];
	const unlocalizedColumns = Object.keys(getTableColumns(table));

	const buildCondition = (conditionObject: Dic): any | false => {
		const [column, operatorObj] = Object.entries(conditionObject)[0];
		const [operator, rawValue] = Object.entries(operatorObj)[0];

		if (!isOperator(operator)) return false;

		const fn = operatorFn(operator);
		const value = formatValue({ operator, value: rawValue });

		// Convert dot notation to double underscore
		const sqlColumn = column.replace(/\./g, '__');

		if (unlocalizedColumns.includes(sqlColumn)) {
			return fn(table[sqlColumn], value);
		}

		if (locale && localizedColumns.includes(sqlColumn)) {
			return inArray(
				table.id,
				db
					.select({ id: tableLocales.parentId })
					.from(tableLocales)
					.where(and(fn(tableLocales[sqlColumn], value), eq(tableLocales.locale, locale)))
			);
		}

		// Try if it's a relation field
		const documentConfig = rizom.config.getBySlug(slug);
		if (!documentConfig) {
			throw new Error('should never happen');
		}
		const relationConfig = rizom.config.getFieldByPath(column, documentConfig.fields);
		if (!relationConfig || !isRelationField(relationConfig)) {
			logger.info(`can't find ${column} in ${documentConfig.slug}.fields`);
			return false;
		}

		if (relationConfig) {
			const [to, localized] = [relationConfig.relationTo, relationConfig.localized];
			const relationTableName = `${slug}Rels`;
			const relationTable = rizom.adapter.tables[relationTableName];
			const conditions = [fn(relationTable[`${to}Id`], value)];

			if (localized) {
				conditions.push(eq(relationTable.locale, locale));
			}
			return inArray(
				table.id,
				db
					.select({ id: relationTable.parentId })
					.from(relationTable)
					.where(and(...conditions))
			);
		}

		return false;
	};

	const conditions = Object.entries(query.where)
		.flatMap(([key, value]) => {
			if (['and', 'or'].includes(key) && Array.isArray(value)) {
				const subConditions = value.map((v) => buildCondition(v as ParsedQs)).filter(Boolean);
				return key === 'and' ? and(...subConditions) : or(...subConditions);
			}
			return buildCondition({ [key]: value } as Dic);
		})
		.filter(Boolean);

	return conditions.length === 1
		? conditions[0]
		: conditions.length > 1
			? and(...conditions)
			: false;
};

const isOperator = (str: string) =>
	['equals', 'in_array', 'not_in_array', 'not_equals', 'like', 'ilike', 'not_like'].includes(str);

const operatorFn = (operator: string): any => {
	const operators: Record<string, any> = {
		equals: drizzleORM.eq,
		not_equals: drizzleORM.ne,
		in_array: drizzleORM.inArray,
		like: drizzleORM.like,
		ilike: drizzleORM.ilike,
		not_like: drizzleORM.notLike,
		not_in_array: drizzleORM.notInArray
	};
	return operators[operator] || drizzleORM.eq;
};

const formatValue = ({ operator, value }: { operator: string; value: any }) => {
	switch (true) {
		case ['in_array', 'not_in_array'].includes(operator):
			return value.split(',');
		case ['like', 'ilike', 'not_like'].includes(operator):
			return `%${value}%`;
		default:
			return value;
	}
};
