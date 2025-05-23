import type { ServerLoadEvent } from '@sveltejs/kit';
import type { AreaSlug } from '$lib/core/types/doc';
import type { AreaData } from './props';

export default function (slug: AreaSlug) {
	const load = async ({ locals }: ServerLoadEvent): Promise<AreaData> => {
		const { api, locale } = locals;

		const area = api.area(slug);
		const authorizedRead = area.config.access.read(locals.user, {});
		const authorizedUpdate = area.config.access.update(locals.user, {});

		if (!authorizedRead) {
			return { doc: {}, operation: 'update', status: 401 };
		}

		const doc = await api.area(slug).find({ locale });

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
