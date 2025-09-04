import type { TreeBlock } from '$lib/core/types/doc.js';
import type { Field, FormField } from '$lib/fields/types.js';
import { snapshot } from '$lib/util/state.js';
import { toPascalCase } from '$lib/util/string.js';
import type { Dic } from '$lib/util/types.js';
import cloneDeep from 'clone-deep';
import { FieldBuilder, FormFieldBuilder } from '../builders/index.js';
import { number } from '../number/index.js';
import { text } from '../text/index.server.js';
import Cell from './component/Cell.svelte';
import Tree from './component/Tree.svelte';

export const tree = (name: string) => new TreeBuilder(name);

export class TreeBuilder extends FormFieldBuilder<TreeField> {
	constructor(name: string) {
		super(name, 'tree');
		this.field.defaultValue = [];
		this.field.isEmpty = (value) => !value || (Array.isArray(value) && value.length === 0);

		this.field.fields = [text('path').hidden(), number('position').hidden()];
		this.field.maxDepth = 50;
		this.field.addItemLabel = 'Add an item';
	}

	get component() {
		return Tree;
	}
	get cell() {
		return Cell;
	}

	_toType() {
		return `${this.field.name}: Array<Tree${toPascalCase(this.field.name)}>,`;
	}

	fields(...fields: FieldBuilder<Field>[]) {
		this.field.fields = [...(this.field.fields || []), ...fields];
		return this;
	}

	addItemLabel(label: string) {
		this.field.addItemLabel = label;
		return this;
	}

	renderTitle(render: TreeFieldBlockRenderTitle) {
		this.field.renderTitle = render;
		return this;
	}

	maxDepth(n: number) {
		this.field.maxDepth = n;
		return this;
	}

	localized() {
		if (this.field.fields.length === 0) {
			throw new Error('localized() must be called after fields assignment');
		}
		this.field.localized = true;

		// Add a locale prop in its fields
		const hasAlreadyLocale = !!this.field.fields
			.filter((field) => field instanceof FormFieldBuilder)
			.find((field) => field.raw.name === 'locale');
		if (!hasAlreadyLocale) {
			this.field.fields.push(text('locale').hidden());
		}
		// Set all descendant fields localized
		this.field.fields = this.field.fields.map((field) => {
			// If it's a "position" or "path" field do not set as localized
			// as it's a treeBlock property
			if (field instanceof FormFieldBuilder && ['position', 'path', 'locale'].includes(field.raw.name)) {
				return field;
			}
			// For all others fields set as localized
			if ('localized' in field && field instanceof FormFieldBuilder) {
				// Clone to prevent localizing a field used elsewhere
				const fieldClone = field.clone();
				fieldClone.localized();
				return fieldClone;
			}
			return field;
		});
		return this;
	}

	compile() {
		return {
			...this.field,
			fields: this.field.fields.map((f) => f.compile())
		};
	}
}

// Utility (debug)
export const treeToString = (blocks: TreeBlock[] | undefined | null) => {
	if (!blocks || !blocks.length) return '[none]';
	const copy = cloneDeep(snapshot(blocks));
	const reduceBlocks = (prev: Dic[], curr: TreeBlock) => {
		if (!curr.path || !curr) {
			throw new Error('wrong tree path');
		}
		const representation = {
			path: `${curr.path} - ${curr.position} - ${curr.id}`,
			_children: curr._children && Array.isArray(curr._children) ? curr._children.reduce(reduceBlocks, []) : []
		};
		prev.push(representation);
		return prev;
	};

	const representation = copy.reduce(reduceBlocks, []);

	function transformToIndentedString(arr: Dic[], indent = 0) {
		let result = '';

		arr.forEach((item: Dic) => {
			// Add indentation based on current level
			result += ' '.repeat(indent * 4) + item.path + '\n';

			// Recursively process children if they exist
			if (item._children && item._children.length > 0) {
				result += transformToIndentedString(item._children, indent + 1);
			}
		});

		return result;
	}

	return '=====================\n' + transformToIndentedString(representation);
};

/****************************************************/
/* Types
/****************************************************/

export type TreeField = FormField & {
	type: 'tree';
	maxDepth: number;
	renderTitle?: TreeFieldBlockRenderTitle;
	fields: FieldBuilder<Field>[];
	addItemLabel: string;
};

export type TreeFieldBlockRenderTitle = (args: { position: string; values: Dic }) => string;

export type TreeFieldRaw = FormField & Omit<TreeField, 'fields'> & { fields: Field[] };
