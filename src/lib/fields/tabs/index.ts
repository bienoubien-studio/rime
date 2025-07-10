import type { Field } from '$lib/fields/types.js';
import { FieldBuilder, FormFieldBuilder } from '../builders/index.js';
import Tabs from './component/Tabs.svelte';
import type { WithoutBuilders } from '$lib/util/types.js';
import { isCamelCase } from '$lib/util/string.js';

export const tabs = (...tabs: TabBuilder[]) => new TabsBuilder(...tabs);
export const tab = (name: string) => new TabBuilder(name);

export class TabsBuilder extends FieldBuilder<TabsField> {
	constructor(...tabs: TabBuilder[]) {
		super('tabs');
		this.field.tabs = tabs;
	}

	get component() {
		return Tabs;
	}

	_toType() {
		return this.field.tabs
			.map((tab) => {
				const fieldsTypes = tab.raw.fields
					.filter((field) => field instanceof FormFieldBuilder)
					.map((field) => field._toType())
					.join(',\n\t\t');
				return `${tab.raw.name}: {${fieldsTypes}}`;
			})
			.join(',\n\t');
	}

	compile(): WithoutBuilders<TabsField> {
		return {
			...this.field,
			tabs: this.field.tabs.map((tab) => tab.compile())
		} as unknown as WithoutBuilders<TabsField>;
	}
}

class TabBuilder {
	#tab: TabsFieldTab;

	constructor(name: string) {
		if (!isCamelCase(name)) throw new Error('Tab name should be camelCase');
		this.#tab = { name, label: name, fields: [], live: true };
	}

	label(label: string) {
		this.#tab.label = label;
		return this;
	}

	fields(...fields: FieldBuilder<Field>[]) {
		this.#tab.fields = fields;
		return this;
	}

	get raw() {
		return { ...this.#tab };
	}

	compile(): WithoutBuilders<TabsFieldTab> {
		return { ...this.#tab, fields: this.#tab.fields.map((f) => f.compile()) };
	}

	live(bool: boolean) {
		this.#tab.live = bool;
		return this;
	}
}

/****************************************************/
/* Types
/****************************************************/

export type TabsField = Field & {
	type: 'tabs';
	tabs: TabBuilder[];
};

export type TabsFieldTab = {
	name: string;
	label?: string;
	live: boolean;
	fields: FieldBuilder<Field>[];
};

export type TabsFieldRaw = Field & {
	type: 'tabs';
	name: string;
	label?: string;
	tabs: Array<Omit<TabsFieldTab, 'fields'> & { fields: Field[] }>;
};
