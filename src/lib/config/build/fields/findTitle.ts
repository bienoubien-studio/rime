import type { FieldBuilder } from 'rizom/fields/builders';
import type { DateField } from 'rizom/fields/date';
import type { EmailField } from 'rizom/fields/email';
import type { SlugField } from 'rizom/fields/slug';
import { TabsBuilder } from 'rizom/fields/tabs';
import type { TextField } from 'rizom/fields/text';
import type { Field } from 'rizom/types';
import { isGroupField } from 'rizom/util/field';

export const hasMaybeTitle = (
	field: Field
): field is TextField | DateField | SlugField | EmailField =>
	['text', 'date', 'slug', 'email'].includes(field.type);

export function findTitleField(fields: FieldBuilder<Field>[]): any | null {
	//
	for (const field of fields) {
		// Direct check for isTitle
		if (hasMaybeTitle(field.raw) && 'isTitle' in field.raw && field.raw.isTitle === true) {
			return field;
		}

		// Check in group
		if (isGroupField(field.raw) && field.raw.fields) {
			const found = findTitleField(field.raw.fields);
			if (found) return found;
		}

		// Check in tabs
		if (field instanceof TabsBuilder && field.raw.tabs) {
			for (const tab of field.raw.tabs) {
				if (tab.raw.fields) {
					const found = findTitleField(tab.raw.fields);
					if (found) return found;
				}
			}
		}
	}

	return null;
}
