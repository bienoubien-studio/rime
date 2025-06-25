import { and, or, eq, getTableColumns, inArray } from 'drizzle-orm';
import * as drizzleORM from 'drizzle-orm';
import { rizom } from '$lib/index.js';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { Dic } from '$lib/util/types.js';
import { logger } from '$lib/core/logger/index.server.js';
import { isRelationField } from '$lib/util/field.js';
import { getFieldConfigByPath } from '$lib/util/config.js';
import type { ParsedQs } from 'qs';
import { RizomError } from '$lib/core/errors/index.js';
import { isDirectorySlug, isVersionsSlug, makeLocalesSlug } from '$lib/util/schema.js';

type BuildWhereArgs = {
	query: ParsedQs;
	slug: string;
	locale?: string;
	db: BetterSQLite3Database<any>;
	draft?: boolean;
};

export const buildWhereParam = ({ query, slug, db, locale }: BuildWhereArgs) => {
	const table = rizom.adapter.tables[slug];
	const tableNameLocales = makeLocalesSlug(slug);
	const tableLocales = rizom.adapter.tables[tableNameLocales];
	
	const localizedColumns =
		locale && tableNameLocales in rizom.adapter.tables ? Object.keys(getTableColumns(tableLocales)) : [];
	const unlocalizedColumns = Object.keys(getTableColumns(table));

	const buildCondition = (conditionObject: Dic): any | false => {
		// Handle nested AND conditions
		if ('and' in conditionObject && Array.isArray(conditionObject.and)) {
			const subConditions = conditionObject.and.map((condition) => buildCondition(condition as Dic)).filter(Boolean);
			return subConditions.length ? and(...subConditions) : false;
		}

		// Handle nested OR conditions
		if ('or' in conditionObject && Array.isArray(conditionObject.or)) {
			const subConditions = conditionObject.or.map((condition) => buildCondition(condition as Dic)).filter(Boolean);
			return subConditions.length ? or(...subConditions) : false;
		}

		// Handle id field for versioned collections
		// if "id" inside the query it should refer to the root table
		// record id not from the versions table
		if (isVersionsSlug(slug) && 'id' in conditionObject) {
			// Replace id with ownerId and keep the same operator and value
			const idOperator = conditionObject.id;
			delete conditionObject.id;
			conditionObject.ownerId = idOperator;
		}

		// Handle regular field conditions
		const [column, operatorObj] = Object.entries(conditionObject)[0];
		const [operator, rawValue] = Object.entries(operatorObj)[0];

		if (!isOperator(operator)) {
			throw new RizomError(RizomError.INVALID_DATA, operator + 'is not supported');
		}

		// get the correct Drizzle operator
		const fn = operators[operator];
		// Format compared value to support Date, Arrays,...
		const value = formatValue({ operator, value: rawValue });

		// Convert dot notation to double underscore
		// for fields included in groups or tabs
		const sqlColumn = column.replace(/\./g, '__');

		// Handle hierarchy fields (_parent, _position) in versioned collections
		if (isVersionsSlug(slug) && (sqlColumn === '_parent' || sqlColumn === '_position' || sqlColumn === '_path')) {
			// Get the root table name by removing the '_versions' suffix
			const rootSlug = slug.replace('_versions', '');
			const rootTable = rizom.adapter.tables[rootSlug];

			// Query the root table for the hierarchy field
			return inArray(
				table.ownerId,
				db.select({ ownerId: rootTable.id }).from(rootTable).where(fn(rootTable[sqlColumn], value))
			);
		}
		
		// Handle regular fields
		if (unlocalizedColumns.includes(sqlColumn)) {
			return fn(table[sqlColumn], value);
		}
		
		// Handle localized fields
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
			logger.warn(`the query contains the field "${column}", not found for ${documentConfig.slug} document`);
			// Return a condition that will always be false instead of returning false
			// This ensures no documents match when a non-existent field is queried
			return eq(table.id, '-1'); // No document will have ID = -1, so this will always be false
		}

		// Not a relation
		if (!isRelationField(fieldConfig)) {
			logger.warn(`the query contains the field "${column}", not found for ${documentConfig.slug} document`);
			// Return a condition that will always be false
			return eq(table.id, '-1'); // No document will have ID = -1, so this will always be false
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
			return !value.includes('%') ? `%${value}%` : value;
		default:
			return value;
	}
};
