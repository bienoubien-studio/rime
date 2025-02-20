import type { GenericBlock } from 'rizom/types/doc.js';
import type { Relation } from '../db/relations.js';
import { hasProps, isObjectLiteral } from './object.js';
import type {
	BlocksField,
	CheckboxField,
	ComboBoxField,
	ComponentField,
	DateField,
	EmailField,
	GroupField,
	LinkField,
	NumberField,
	RadioField,
	RelationField,
	RichTextField,
	SelectField,
	SeparatorField,
	SlugField,
	TabsField,
	TextField,
	ToggleField
} from 'rizom/fields/types';
import type { Dic } from 'rizom/types/utility.js';
import type { AnyField, FormField, Field } from 'rizom/types/fields.js';
import type { BlocksFieldRaw } from 'rizom/fields/blocks/index.js';
import type { GroupFieldRaw } from 'rizom/fields/group/index.js';
import type { TabsFieldRaw } from 'rizom/fields/tabs/index.js';
import type { TreeFieldRaw } from 'rizom/fields/tree/index.js';

export const isPresentative = (field: Field): field is GroupField | SeparatorField | TabsField =>
	['group', 'separator', 'tabs'].includes(field.type);

export const isFormField = (field: Field): field is FormField => 'name' in field;
export const isNotHidden = (field: FormField) => !field.hidden;
export const isLiveField = (field: Field) => field.live;
export const isComponentField = (field: Field): field is ComponentField =>
	field.type === 'component';
export const isBlocksField = (field: Field): field is BlocksField => field.type === 'blocks';
export const isBlocksFieldRaw = (field: Field): field is BlocksFieldRaw => field.type === 'blocks';
export const isTreeFieldRaw = (field: Field): field is TreeFieldRaw => field.type === 'tree';
export const isTextField = (field: Field): field is TextField => field.type === 'text';
export const isEmailField = (field: Field): field is EmailField => field.type === 'email';
export const isNumberField = (field: Field): field is NumberField => field.type === 'number';
export const isSelectField = (field: Field): field is SelectField => field.type === 'select';
export const isComboBoxField = (field: Field): field is ComboBoxField => field.type === 'combobox';
export const isLinkField = (field: Field): field is LinkField => field.type === 'link';
export const isToggleField = (field: Field): field is ToggleField => field.type === 'toggle';
export const isGroupField = (field: Field): field is GroupField => field.type === 'group';
export const isGroupFieldRaw = (field: Field): field is GroupFieldRaw => field.type === 'group';
export const isTabsField = (field: Field): field is TabsField => field.type === 'tabs';
export const isTabsFieldRaw = (field: Field): field is TabsFieldRaw => field.type === 'tabs';
export const isRadioField = (field: Field): field is RadioField => field.type === 'radio';
export const isCheckboxField = (field: Field): field is CheckboxField => field.type === 'checkbox';
export const isDateField = (field: Field): field is DateField => field.type === 'date';
export const isRichTextField = (field: Field): field is RichTextField => field.type === 'richText';
export const isRelationField = (field: Field): field is RelationField => field.type === 'relation';
export const isSlugField = (field: Field): field is SlugField => field.type === 'slug';
export const isRolesField = (field: Field): field is SelectField =>
	isFormField(field) && isSelectField(field) && field.name === 'roles';
export const hasMaybeTitle = (
	field: Field
): field is TextField | DateField | SlugField | EmailField =>
	['text', 'date', 'slug', 'email'].includes(field.type);
export const isRelationResolved = <T>(value: any): value is T => {
	return value && isObjectLiteral(value) && hasProps(value, ['title', '_prototype', '_type']);
};
export const isRelationUnresolved = (
	value: any
): value is Omit<Relation, 'path' | 'position' | 'parentId'> => {
	return value && isObjectLiteral(value) && hasProps(value, ['relationTo', 'relationId']);
};
export const resolveRelation = async <T>(value: any): Promise<T> => {
	if (isRelationResolved<T>(value)) {
		return value;
	}
	return (await fetch(`api/${value.relationTo}/${value.relationId}`)
		.then((r) => r.json())
		.then((r) => r.doc)) as T;
};
export const richTextJSONToText = (value: string): string => {
	let textValue: string;
	const renderNodes = (nodes: { [k: string]: any }) => {
		return nodes
			.map((node: { text?: string; [k: string]: any }) => {
				if ('text' in node) {
					return node.text;
				} else if ('content' in node) {
					return renderNodes(node.content);
				}
			})
			.join(' ');
	};

	try {
		const doc = JSON.parse(value);
		textValue = renderNodes(doc.content);
	} catch {
		textValue = value;
	}
	return textValue;
};

export function toFormFields(prev: any[], curr: any) {
	if (curr.type === 'tabs') {
		return curr.tabs.reduce(toFormFields, prev);
	} else if (curr.type === 'tree') {
		curr = {
			...curr,
			fields: curr.fields.reduce(toFormFields, [])
		};
	} else if (curr.type === 'blocks') {
		curr = {
			...curr,
			blocks: curr.blocks.map((b: GenericBlock) => ({
				...b,
				fields: b.fields.reduce(toFormFields, [])
			}))
		};
	} else if ('fields' in curr) {
		return curr.fields.reduce(toFormFields, prev);
	}
	prev.push(curr);
	return prev;
}

export const emptyFieldsFromFieldConfig = <T extends FormField>(arr: T[]): Dic => {
	return Object.assign(
		{},
		...arr.map((config) => {
			let emptyValue;
			if ('defaultValue' in config) {
				if (typeof config.defaultValue === 'function') {
					emptyValue = config.defaultValue();
				} else {
					emptyValue = config.defaultValue;
				}
			}
			return {
				[config.name]: emptyValue
			};
		})
	);
};
