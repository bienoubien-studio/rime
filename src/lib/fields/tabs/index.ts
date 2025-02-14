import type { AnyField } from 'rizom/types';
import type { Field } from 'rizom/types/fields';
import { FieldBuilder } from '../builders/index.js';

import Tabs from './component/Tabs.svelte';

export class TabsBuilder extends FieldBuilder<TabsField> {
	//
	constructor(...tabs: TabsFieldTab[]) {
		super('tabs');
		this.field.tabs = tabs;
	}

	get component() {
		return Tabs;
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
		return this.#tab;
	}
}

export const tabs = (...tabs: TabsFieldTab[]) => new TabsBuilder(...tabs);

export const tab = (label: string) => new TabBuilder(label);

/////////////////////////////////////////////
// Types
//////////////////////////////////////////////

export type TabsField = Field & {
	type: 'tabs';
	tabs: TabsFieldTab[];
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
