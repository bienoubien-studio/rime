import { findTitleField } from '$lib/core/config/build/fields/findTitle.js';
import type { CollectionWithoutSlug } from './types.js';

/**
 * Set asTitle to the defined one, or fallback to
 * filename for upload, email for auth, or default to id
 */
export const augmentTitle = <T extends CollectionWithoutSlug<any>>(config: T) => {
	const addAsTitle = () => {
		const titleField = findTitleField(config.fields);

		switch (true) {
			case !!titleField:
				return titleField.path;
			case !!config.upload:
				return 'filename';
			case !!config.auth:
				return 'email';
			default:
				return 'id';
		}
	};

	return {
		...config,
		asTitle: addAsTitle()
	};
};
