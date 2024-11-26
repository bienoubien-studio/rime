import {
	isBlocksField,
	isComboBoxField,
	isDateField,
	isEmailField,
	isGroupField,
	isLinkField,
	isNumberField,
	isSelectField,
	isTabsField
} from '$lib/utils/field.js';
import { capitalize } from '$lib/utils/string.js';
import validate from '$lib/utils/validate.js';

export const augment = (prev: any[], curr: any) => {
	if (isBlocksField(curr)) {
		curr = {
			...curr,
			blocks: curr.blocks.map((block) => ({
				...block,
				fields: [
					{ name: 'type', type: 'text', hidden: true },
					{ name: 'path', type: 'text', hidden: true },
					{ name: 'position', type: 'number', hidden: true },
					...block.fields.reduce(augment, [])
				]
			}))
		};
	} else if (isTabsField(curr)) {
		curr = {
			...curr,
			tabs: curr.tabs.map((tab) => ({
				...tab,
				fields: tab.fields.reduce(augment, [])
			}))
		};
	} else if (isGroupField(curr)) {
		curr = {
			...curr,
			fields: curr.fields.reduce(augment, [])
		};
	} else if (isSelectField(curr) || isComboBoxField(curr)) {
		curr = {
			...curr,
			options: curr.options.map((option) => {
				const hasNoLabel = !('label' in option);
				if (hasNoLabel) {
					return {
						value: option.value,
						label: capitalize(option.value)
					};
				}
				return option;
			})
		};
	} else if (isEmailField(curr)) {
		curr = {
			validate: validate.email,
			...curr
		};
	} else if (isDateField(curr)) {
		curr = {
			defaultValue: () => {
				let date = new Date();
				date.setHours(0, 0, 0, 0);
				return date;
			},
			...curr
		};
	} else if (isLinkField(curr)) {
		curr = {
			validate: validate.link,
			...curr
		};
	} else if (isNumberField(curr)) {
		curr = {
			min: 0,
			defaultValue: curr.min || 0,
			...curr
		};
	}
	prev.push({ ...curr });
	return prev;
};
