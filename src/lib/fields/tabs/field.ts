import { FieldBuilder } from '../field-builder.js';
import type { TabsField, TabsFieldTab } from './index.js';
import type { UserDefinedField } from 'rizom/types';
import Tabs from './component/Tabs.svelte';
import type { FieldBluePrint } from '../index.js';
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
