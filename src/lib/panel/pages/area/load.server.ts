import type { ServerLoadEvent } from '@sveltejs/kit';
import type { AreaSlug } from '$lib/core/types/doc';
import { PARAMS } from '$lib/core/constant.js';
import type { Dic, WithRequired } from '$lib/util/types.js';
import type { Route } from '$lib/panel/types.js';
import { makeVersionsSlug } from '$lib/util/schema.js';
import { env } from '$env/dynamic/public';
import { trycatch } from '$lib/util/trycatch.js';
import { RizomError } from '$lib/core/errors/index.js';

export default function (slug: AreaSlug, withVersions?: boolean) {
	//
	const load = async ({ locals, url, fetch }: ServerLoadEvent) => {
		const { rizom, locale } = locals;

		const area = rizom.area(slug);
		const authorizedRead = area.config.access.read(locals.user, {});
		const authorizedUpdate = area.config.access.update(locals.user, {});

		if (!authorizedRead) {
			return { doc: {}, operation: 'update', status: 401 };
		}

		const versionId = url.searchParams.get(PARAMS.VERSION_ID) || undefined;
		const draft = url.searchParams.get(PARAMS.DRAFT) ? url.searchParams.get(PARAMS.DRAFT) === 'true' : undefined;
		const doc = await area.find({ locale, versionId, draft });

		if (!authorizedUpdate) {
			return { doc, operation: 'update', status: 200, readOnly: true };
		}

		const aria: WithRequired<Partial<Route>, 'title'>[] = [
			{ title: 'Dashboard', icon: 'dashboard', path: `/panel` },
			{ title: area.config.label }
		];

		let data: Dic = {
			aria,
			doc,
			operation: 'update',
			status: 200,
			readOnly: false,
			slug
		};

		if (withVersions) {
			const url = `${env.PUBLIC_RIZOM_URL}/api/${makeVersionsSlug(doc._type)}?where[ownerId][equals]=${doc.id}&sort=-updatedAt&select=updatedAt,status`;
			const promise = fetch(url).then((r) => r.json());
			const [error, result] = await trycatch(promise);
			if (error || !Array.isArray(result.docs)) {
				throw new RizomError(RizomError.OPERATION_ERROR, 'while getting versions');
			}
			data = { ...data, versions: result.docs };
		}

		return data;
	};
	return load;
}
