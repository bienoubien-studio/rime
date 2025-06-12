import { text } from '$lib/fields/text/index.js';
import { VERSIONS_STATUS } from "$lib/core/constant.js";
import type { AugmentAreaFn } from "./types.js";

/**
 * Add versions related fields and
 * nomalize config.versions prop
 */
export const augmentVersions: AugmentAreaFn = ({ config, fields }) => {
	if (config.versions) {
		if (config.versions === true) {
			config.versions = {
				draft: false,
				autoSave: false,
				maxVersions: 20
			};
		}
		if (!config.versions.maxVersions) {
			config.versions.maxVersions = 20;
		}
		if (config.versions.draft) {
			fields.push(text('status').defaultValue(VERSIONS_STATUS.DRAFT).hidden());
		}
	} else {
		config.versions = false;
	}
	return { config, fields };
};
