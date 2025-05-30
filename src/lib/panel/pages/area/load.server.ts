import type { ServerLoadEvent } from '@sveltejs/kit';
import type { AreaSlug } from '$lib/core/types/doc';
import type { AreaData } from './props';

export default function (slug: AreaSlug) {
	const load = async ({ locals, url }: ServerLoadEvent): Promise<AreaData> => {
		const { rizom, locale } = locals;

		const areaAPI = rizom.area(slug);
		const authorizedRead = areaAPI.config.access.read(locals.user, {});
		const authorizedUpdate = areaAPI.config.access.update(locals.user, {});

		if (!authorizedRead) {
			return { doc: {}, operation: 'update', status: 401 };
		}

		const versionId = url.searchParams.get('versionId') || undefined
		const draft = url.searchParams.get('draft') ? url.searchParams.get('draft') === 'true' : undefined
		const doc = await areaAPI.find({ locale, versionId, draft });

		if (!authorizedUpdate) {
			return { doc, operation: 'update', status: 200, readOnly: true };
		}
		
		return {
			doc,
			operation: 'update',
			status: 200,
			readOnly: false,
			slug
		};
	};
	return load;
}
