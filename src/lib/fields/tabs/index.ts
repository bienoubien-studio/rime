import type { AnyField } from 'rizom/types';
import type { BaseField } from 'rizom/types/fields';
import { FieldBuilder } from '../_builders/index.js';
import type { UserDefinedField } from 'rizom/types';
import Tabs from './component/Tabs.svelte';
import type { PublicBuilder } from 'rizom/types/utility.js';

class TabsBuilder extends FieldBuilder<TabsField> {
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
	fields(...fields: UserDefinedField[]) {
		this.#tab.fields = fields;
		return this.#tab;
	}
}

export const tabs = (...tabs: TabsFieldTab[]) =>
	new TabsBuilder(...tabs) as PublicBuilder<typeof TabsBuilder>;

export const tab = (label: string) => new TabBuilder(label);

/////////////////////////////////////////////
// Types
//////////////////////////////////////////////

export type TabsField = BaseField & {
	type: 'tabs';
	tabs: TabsFieldTab[];
};

export type TabsFieldTab = {
	label: string;
	fields: FieldBuilder<AnyField>[];
};

/////////////////////////////////////////////
// Register
//////////////////////////////////////////////
declare module 'rizom' {
	interface RegisterFieldsType {
		tabs: any;
	}
	interface RegisterFields {
		TabsField: TabsField; // register the field type
	}
}
