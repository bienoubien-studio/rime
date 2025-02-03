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
import type { Dic, WithoutBuilders } from 'rizom/types/utility.js';
import type { AnyField, AnyFormField } from 'rizom/types/fields.js';

export const isFormField = (field: AnyField): field is AnyFormField => 'name' in field;

export const isNotHidden = (field: AnyFormField) => !field.hidden;

export const isLiveField = (field: AnyField) => field.live;

// export const isPresentative = (
// 	field: AnyField
// ): field is GroupField<'compiled'> | SeparatorField | TabsField<'compiled'> =>
// 	['group', 'separator', 'tabs'].includes(field.type);

export const isComponentField = (field: AnyField): field is ComponentField =>
	field.type === 'component';

export const isBlocksField = (field: AnyField): field is BlocksField => field.type === 'blocks';

export const isTextField = (field: AnyField): field is TextField => field.type === 'text';

export const isEmailField = (field: AnyField): field is EmailField => field.type === 'email';

export const isNumberField = (field: AnyField): field is NumberField => field.type === 'number';

export const isSelectField = (field: AnyField): field is SelectField => field.type === 'select';

export const isComboBoxField = (field: AnyField): field is ComboBoxField =>
	field.type === 'combobox';

export const isLinkField = (field: AnyField): field is LinkField => field.type === 'link';

export const isToggleField = (field: AnyField): field is ToggleField => field.type === 'toggle';

export const isGroupField = (field: AnyField): field is GroupField => field.type === 'group';

export const isTabsField = (field: AnyField): field is TabsField => field.type === 'tabs';

export const isRadioField = (field: AnyField): field is RadioField => field.type === 'radio';

export const isCheckboxField = (field: AnyField): field is CheckboxField =>
	field.type === 'checkbox';

export const isDateField = (field: AnyField): field is DateField => field.type === 'date';

export const isRichTextField = (field: AnyField): field is RichTextField =>
	field.type === 'richText';

export const isRelationField = (field: AnyField): field is RelationField =>
	field.type === 'relation';

export const isSlugField = (field: AnyField): field is SlugField => field.type === 'slug';

export const isRolesField = (field: AnyField): field is SelectField =>
	isFormField(field) && isSelectField(field) && field.name === 'roles';

export const hasMaybeTitle = (
	field: AnyField
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
	} else if (curr.type === 'group') {
		return curr.fields.reduce(toFormFields, prev);
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

// @TODO
// add a toBlankValue inside each fields config
export const emptyFieldsFromFieldConfig = <T extends AnyFormField>(arr: T[]): Dic => {
	return Object.assign(
		{},
		...arr.map((config) => {
			let emptyValue;
			if (isBlocksField(config) || isRelationField(config) || isSelectField(config)) {
				emptyValue = [];
			} else if (isLinkField(config)) {
				emptyValue = { label: '', type: 'url', link: null, target: '_self' };
			} else {
				emptyValue = null;
			}
			return {
				[config.name]: emptyValue
			};
		})
	);
};
