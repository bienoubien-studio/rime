import type { AnyField } from 'rizom/types';
import type { Field } from 'rizom/types/fields';
import { FieldBuilder } from '../builders/index.js';
import Tabs from './component/Tabs.svelte';
import type { WithoutBuilders } from 'rizom/types/util.js';

export const tabs = (...tabs: TabBuilder[]) => new TabsBuilder(...tabs);
export const tab = (label: string) => new TabBuilder(label);

export class TabsBuilder extends FieldBuilder<TabsField> {
	constructor(...tabs: TabBuilder[]) {
		super('tabs');
		this.field.tabs = tabs;
	}

	get component() {
		return Tabs;
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
	constructor(label: string) {
		this.#tab = { label, fields: [] };
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
}

/////////////////////////////////////////////
// Types
//////////////////////////////////////////////

export type TabsField = Field & {
	type: 'tabs';
	tabs: TabBuilder[];
};

export type TabsFieldTab = {
	label: string;
	fields: FieldBuilder<Field>[];
};

export type TabsFieldRaw = Field & {
	type: 'tabs';
	tabs: {
		label: string;
		fields: Field[];
	}[];
};

/////////////////////////////////////////////
// Register
//////////////////////////////////////////////
declare module 'rizom' {
	interface RegisterFieldsType {
		tabs: any;
	}
	interface RegisterFields {
		TabsField: TabsField;
	}
}
