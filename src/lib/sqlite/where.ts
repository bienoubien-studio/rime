import { and, or, eq, getTableColumns, inArray } from 'drizzle-orm';
import * as drizzleORM from 'drizzle-orm';
import qs, { type ParsedQs } from 'qs';
import { rizom } from '$lib/index.js';
import type { PrototypeSlug } from '$lib/types/doc.js';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { Dic } from '../types/util.js';
import { RizomError } from '../errors/index.js';
import { isObjectLiteral } from '../util/object.js';
import type { OperationQuery } from '../types/index.js';
import { logger } from '$lib/util/logger/index.server.js';
import { isRelationField } from '$lib/util/field.js';
import { getFieldConfigByPath } from 'rizom/util/config.js';

type BuildWhereArgs = {
	query: OperationQuery | string;
	slug: string;
	locale?: string;
	db: BetterSQLite3Database<any>;
};

export const buildWhereParam = ({ query: incomingQuery, slug, db, locale }: BuildWhereArgs) => {
	let query: OperationQuery;

	if (typeof incomingQuery === 'string') {
		try {
			query = qs.parse(incomingQuery);
		} catch (err: any) {
			throw new RizomError('Unable to parse given string query ' + err.message);
		}
	} else {
		if (!isObjectLiteral(incomingQuery)) {
			throw new RizomError('Unable to parse given object query');
		}
		query = incomingQuery;
	}

	if (!query.where) {
		logger.warn(`The query should have a root "where" property`);
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
		// Handle nested AND conditions
		if ('and' in conditionObject && Array.isArray(conditionObject.and)) {
			const subConditions = conditionObject.and
				.map((condition) => buildCondition(condition as Dic))
				.filter(Boolean);
			return subConditions.length ? and(...subConditions) : false;
		}

		// Handle nested OR conditions
		if ('or' in conditionObject && Array.isArray(conditionObject.or)) {
			const subConditions = conditionObject.or
				.map((condition) => buildCondition(condition as Dic))
				.filter(Boolean);
			return subConditions.length ? or(...subConditions) : false;
		}

		// Handle regular field conditions
		const [column, operatorObj] = Object.entries(conditionObject)[0];
		const [operator, rawValue] = Object.entries(operatorObj)[0];

		if (!isOperator(operator)) {
			logger.warn(`The operator "${operator}" is not supported`);
			return false;
		}

		// get the correct Drizzle operator
		const fn = operators[operator];
		// Format compared value to support Date, Arrays,...
		const value = formatValue({ operator, value: rawValue });

		// Convert dot notation to double underscore
		// for fields included in groups or tabs
		const sqlColumn = column.replace(/\./g, '__');

		// Handle in18
		if (unlocalizedColumns.includes(sqlColumn)) {
			return fn(table[sqlColumn], value);
		}

		if (locale && localizedColumns.includes(sqlColumn)) {
			return inArray(
				table.id,
				db
					.select({ id: tableLocales.ownerId })
					.from(tableLocales)
					.where(and(fn(tableLocales[sqlColumn], value), eq(tableLocales.locale, locale)))
			);
		}

		// Look for a relation field
		// Get document config
		const documentConfig = rizom.config.getBySlug(slug);
		if (!documentConfig) {
			throw new Error(`${slug} not found (should never happen)`);
		}

		// Get the field config
		const fieldConfig = getFieldConfigByPath(column, documentConfig.fields);

		if (!fieldConfig) {
			// @TODO handle relation props ex: author.email
			logger.warn(
				`the query contains the field "${column}", not found for ${documentConfig.slug} document`
			);
			return false;
		}

		// Not a relation
		if (!isRelationField(fieldConfig)) {
			logger.warn(
				`the query contains the field "${column}" which is not a relation of ${documentConfig.slug}`
			);
			return false;
		}

		// Only compare with the relation ID for now
		// @TODO handle relation props ex: author.email
		const [to, localized] = [fieldConfig.relationTo, fieldConfig.localized];
		const relationTableName = `${slug}Rels`;
		const relationTable = rizom.adapter.tables[relationTableName];
		const conditions = [fn(relationTable[`${to}Id`], value)];

		if (localized) {
			conditions.push(eq(relationTable.locale, locale));
		}
		return inArray(
			table.id,
			db
				.select({ id: relationTable.ownerId })
				.from(relationTable)
				.where(and(...conditions))
		);
	};

	return buildCondition(query.where as Dic);
};

const operators: Record<string, any> = {
	equals: drizzleORM.eq,
	not_equals: drizzleORM.ne,
	in_array: drizzleORM.inArray,
	like: drizzleORM.like,
	ilike: drizzleORM.ilike,
	between: drizzleORM.between,
	not_between: drizzleORM.notBetween,
	not_like: drizzleORM.notLike,
	not_in_array: drizzleORM.notInArray,
	is_not_null: drizzleORM.isNotNull,
	is_null: drizzleORM.isNull,
	less_than_or_equals: drizzleORM.lte,
	less_than: drizzleORM.lt,
	greater_than_or_equals: drizzleORM.gte,
	greater_than: drizzleORM.gt
};

const isOperator = (str: string) => Object.keys(operators).includes(str);

const formatValue = ({ operator, value }: { operator: string; value: any }) => {
	switch (true) {
		case typeof value === 'string' &&
			/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?)?$/.test(value):
			return new Date(value);
		case ['in_array', 'not_in_array'].includes(operator):
			// Value is an array do nothing
			if (Array.isArray(value)) return value;
			// Handle string value with "," separators for url params
			return value.split(',');
		case ['like', 'ilike', 'not_like'].includes(operator):
			return `%${value}%`;
		default:
			return value;
	}
};
