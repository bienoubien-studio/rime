import { RizomError } from '$lib/core/errors/index.js';
import { logger } from '$lib/core/logger/index.server.js';
import type { GetRegisterType } from '$lib/index.js';
import { and, eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { CompiledArea, CompiledCollection } from '../types.js';
import { makeLocalesSlug, makeVersionsSlug } from './generate-schema/util.js';
import type { GenericTables } from './types.js';

type Params = {
	id: string;
	versionId?: string;
	config: CompiledArea | CompiledCollection;
	locale?: string;
	db: BetterSQLite3Database<GetRegisterType<'Schema'>>;
	tables: GenericTables;
};

const OPERATION = {
	ROOT: 0,
	LOCALE: 1,
	VERSION: 2,
	VERSION_LOCALE: 3
};

export async function updateDocumentUrl(url: string, params: Params) {
	//
	const { config, id, versionId, tables, db } = params;
	const operationType = defineOperation(params.locale, params.config);
	let operation;

	switch (operationType) {
		case OPERATION.ROOT: {
			const table = tables[config.slug];
			operation = db.update(table).set({ url }).where(eq(table.id, id));
			break;
		}

		case OPERATION.LOCALE: {
			const tableLocale = tables[makeLocalesSlug(config.slug) as keyof typeof tables];
			operation = db
				.update(tableLocale)
				.set({ url })
				.where(
					and(
						//
						eq(tableLocale.ownerId, id),
						eq(tableLocale.locale, params.locale)
					)
				);
			break;
		}

		case OPERATION.VERSION: {
			const tableVersions = tables[makeVersionsSlug(config.slug)];
			operation = db
				.update(tableVersions)
				.set({ url })
				.where(
					and(
						//
						eq(tableVersions.ownerId, id),
						eq(tableVersions.id, versionId)
					)
				);
			break;
		}

		case OPERATION.VERSION_LOCALE: {
			const tableVersionsLocales = tables[makeLocalesSlug(makeVersionsSlug(config.slug)) as keyof typeof tables];
			operation = db
				.update(tableVersionsLocales)
				.set({ url })
				.where(
					and(
						//
						eq(tableVersionsLocales.ownerId, versionId),
						eq(tableVersionsLocales.locale, params.locale)
					)
				);
			break;
		}

		default:
			logger.warn(`can't define url update operation for ${config.slug}, ${id}`);
	}

	if (operation) {
		try {
			operation.run();
		} catch (err: any) {
			console.log(operation.toSQL());
			throw new RizomError(RizomError.OPERATION_ERROR, `Error storing url for ${config.slug}, ${id}. ${err.message}`);
		}
	}
}

const defineOperation = (locale: Params['locale'], config: Params['config']) => {
	if (!locale && !config.versions) {
		return OPERATION.ROOT;
	}
	if (locale && !config.versions) {
		return OPERATION.LOCALE;
	}
	if (!locale && !!config.versions) {
		return OPERATION.VERSION;
	}
	if (!!locale && !!config.versions) {
		return OPERATION.VERSION_LOCALE;
	}
};
