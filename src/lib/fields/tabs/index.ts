import type { AnyField } from 'rizom/types';
import type { BaseField } from 'rizom/types/fields';
import { FieldBuilder } from '../_builders/index.js';
import type { UserDefinedField } from 'rizom/types';
import Tabs from './component/Tabs.svelte';
import type { FieldBluePrint } from 'rizom/types/fields';
import { compileField } from '../compile.js';

export const blueprint: FieldBluePrint<TabsField> = {
	component: Tabs,
	match: (field): field is TabsField => field.type === 'tabs'
};

class TabsBuilder extends FieldBuilder<TabsField> {
	//
	constructor(...tabs: TabsFieldTab[]) {
		super('tabs');
		this.field.tabs = tabs;
	}
}

class TabBuiler {
	#tab: TabsFieldTab;
	constructor(label: string) {
		this.#tab = { label, fields: [] };
		return this;
	}
	fields(...fields: UserDefinedField[]) {
		this.#tab.fields = fields.map(compileField);
		return this.#tab;
	}
}

export const tabs = (...tabs: TabsFieldTab[]) => new TabsBuilder(...tabs);
export const tab = (label: string) => new TabBuiler(label);

/////////////////////////////////////////////
// Types
//////////////////////////////////////////////

export type TabsField = BaseField & {
	type: 'tabs';
	tabs: TabsFieldTab[];
};

export type TabsFieldTab = {
	label: string;
	fields: AnyField[];
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
