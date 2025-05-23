import type { RequestEvent } from '@sveltejs/kit';
import type { CompiledArea } from '$lib/core/config/types/index.js';
import type { AreaSlug, GenericDoc } from '$lib/core/types/doc.js';
import type { Adapter } from '$lib/adapter-sqlite/index.server.js';
import { RizomError } from '$lib/core/errors/index.js';
import { transformDocument } from '$lib/core/operations/shared/transformDocument.server.js';
import type { LocalAPI } from '../../operations/local-api.server.js';
import type { RegisterArea } from '$lib/index.js';

type FindArgs = {
	locale?: string | undefined;
	config: CompiledArea;
	event: RequestEvent;
	adapter: Adapter;
	api: LocalAPI;
	depth?: number;
	select?: string[];
	versionId?: string;
};

export const find = async <T extends GenericDoc>(args: FindArgs): Promise<T> => {
	//
	const { config, event, adapter, locale, api, depth, select, versionId } = args;

	const authorized = config.access.read(event.locals.user, {});
	if (!authorized) {
		throw new RizomError(RizomError.UNAUTHORIZED, 'try to read ' + config.slug );
	}

	const documentRaw = await adapter.area.get({
		slug: config.slug,
		locale,
		select,
		versionId
	});

	let document = await transformDocument<T>({
		raw: documentRaw,
		config,
		api,
		adapter,
		locale,
		depth,
		event,
		augment: Array.isArray(select) && select.length ? false : true,
		withBlank: Array.isArray(select) && select.length ? false : true,
	});
	
	for (const hook of config.hooks?.beforeRead || []) {
		const result = await hook({
			doc: document as unknown as RegisterArea[AreaSlug],
			config,
			operation: 'read',
			api,
			rizom: event.locals.rizom,
			event
		});
		document = result.doc as unknown as T;
	}
	
	return document;
};
