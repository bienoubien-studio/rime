import { BlocksBuilder } from '$lib/fields/blocks/index.js';
import { isTabsField } from '$lib/util/field.js';
import Email from '$lib/fields/email/component/Email.svelte';
import Text from '$lib/fields/text/component/Text.svelte';
import { GroupFieldBuilder } from '$lib/fields/group/index.js';
import { TreeBuilder } from '$lib/fields/tree/index.js';
import type { FieldBuilder } from '$lib/fields/builders/field.js';
import type { FieldsComponents } from '$lib/panel/types';
import type { Field } from '$lib/fields/types.js';

export function buildComponentsMap(
	fields: FieldBuilder<Field>[]
): Record<string, FieldsComponents> {
	// Add Text and Email by default as needed for Login/Init forms
	const componentsMap: Record<string, FieldsComponents> = {
		email: { component: Email },
		text: { component: Text }
	};

	function addToMap(field: FieldBuilder<Field>) {
		if (field.component) {
			componentsMap[field.type] = {
				component: field.component,
				cell: field.cell
			};
		}
	}

	for (const field of fields) {
		// Add current field if it has component
		addToMap(field);
		
		// Check in blocks
		if (field instanceof BlocksBuilder && field.raw.blocks) {
			for (const block of field.raw.blocks) {
				if (block.raw.fields) {
					Object.assign(componentsMap, buildComponentsMap(block.raw.fields));
				}
			}
		}

		// Check in trees
		if (field instanceof TreeBuilder && field.raw.fields) {
			Object.assign(componentsMap, buildComponentsMap(field.raw.fields));
		}

		// Check in group
		if (field instanceof GroupFieldBuilder && field.raw.fields) {
			Object.assign(componentsMap, buildComponentsMap(field.raw.fields));
		}

		// Check in tabs
		if (isTabsField(field.raw) && field.raw.tabs) {
			for (const tab of field.raw.tabs) {
				if (tab.raw.fields) {
					Object.assign(componentsMap, buildComponentsMap(tab.raw.fields));
				}
			}
		}
	}

	return componentsMap;
}
