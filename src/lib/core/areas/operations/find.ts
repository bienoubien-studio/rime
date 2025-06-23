import type { RequestEvent } from '@sveltejs/kit';
import type { CompiledArea } from '$lib/core/config/types/index.js';
import type { AreaSlug, GenericDoc } from '$lib/core/types/doc.js';
import { RizomError } from '$lib/core/errors/index.js';
import type { Rizom } from '../../rizom.server.js';
import { rizom, type RegisterArea } from '$lib/index.js';
import type { Dic } from '$lib/util/types.js';

type FindArgs = {
	locale?: string | undefined;
	config: CompiledArea;
	event: RequestEvent;
	rizom: Rizom;
	depth?: number;
	select?: string[];
	versionId?: string;
	draft?: boolean;
};

export const find = async <T extends GenericDoc>(args: FindArgs): Promise<T> => {
	//
	const { config, event, locale, depth, select, versionId, draft } = args;

	const authorized = config.access.read(event.locals.user, {});
	if (!authorized) {
		throw new RizomError(RizomError.UNAUTHORIZED, 'try to read ' + config.slug);
	}

	const documentRaw = await rizom.adapter.area.get({
		slug: config.slug,
		locale,
		select,
		versionId,
		draft
	});

	const hasSelect = select && Array.isArray(select) && !!select.length;

	let document = await event.locals.rizom.adapter.transform.doc({
		doc: documentRaw,
		slug: config.slug,
		locale,
		event,
		depth,
		withBlank: !hasSelect
	});
	
	let metas:Dic = { depth, select, draft }
	for (const hook of config.hooks?.beforeRead || []) {
		const result = await hook({
			doc: document as unknown as RegisterArea[AreaSlug],
			config,
			operation: 'read',
			rizom: event.locals.rizom,
			event,
			metas
		});
		metas = result.metas
		document = result.doc as unknown as T;
	}

	return document as T;
};
