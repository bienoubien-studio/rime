import { text } from '$lib/fields/text/index.js';
import { VERSIONS_STATUS } from '$lib/core/constant.js';
import type { AugmentCollectionFn } from './types.js';

/**
 * Normalize versions prop and add status field if config.versions.drat is true
 */
export const augmentVersions: AugmentCollectionFn = ({ config, fields }) => {
	if (config.versions) {
		if (config.versions === true) {
			config.versions = {
				draft: false,
				autoSave: false,
				maxVersions: 12
			};
		}
		if (!config.versions.maxVersions) {
			config.versions.maxVersions = 12;
		}
		if (config.versions.draft) {
			fields.push(text('status').defaultValue(VERSIONS_STATUS.DRAFT).hidden());
		}
	} else {
		config.versions = false;
	}
	return { config, fields };
};
