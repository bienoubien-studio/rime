import type { AnyField } from 'rizom/types';
import { hasMaybeTitle, isBlocksField, isGroupField, isTabsField } from 'rizom/utils/field';

export function findTitleField(fields: AnyField[]): any | null {
	for (const field of fields) {
		// Direct check for isTitle
		if (hasMaybeTitle(field) && field.isTitle === true) {
			return field;
		}

		// Check in blocks
		if (isBlocksField(field) && field.blocks) {
			for (const block of field.blocks) {
				if (block.fields) {
					const found = findTitleField(block.fields);
					if (found) return found;
				}
			}
		}

		// Check in group
		if (isGroupField(field) && field.fields) {
			const found = findTitleField(field.fields);
			if (found) return found;
		}

		// Check in tabs
		if (isTabsField(field) && field.tabs) {
			for (const tab of field.tabs) {
				if (tab.fields) {
					const found = findTitleField(tab.fields);
					if (found) return found;
				}
			}
		}
	}

	return null;
}
