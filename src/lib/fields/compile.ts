import { FieldBuilder } from './builders/index.js';

import { isBlocksField, isGroupField, isTabsField } from 'rizom/utils/field.js';
import type { TabsFieldTab } from './tabs/index.js';
import type { BlocksFieldBlock } from './types.js';
import type { Field } from 'rizom/types/fields.js';

export const compileFields = (fields: FieldBuilder<Field>[]) => {
	return fields.reduce(compile, []);
};

const compile = (prev: any[], curr: any) => {
	if (curr instanceof FieldBuilder) {
		curr = curr.toField();
	}
	if (isTabsField(curr)) {
		curr = {
			...curr,
			tabs: curr.tabs.map((tab: TabsFieldTab) => ({
				...tab,
				fields: tab.fields.reduce(compile, [])
			}))
		};
	} else if (isGroupField(curr)) {
		curr = {
			...curr,
			fields: curr.fields.reduce(compile, [])
		};
	} else if (isBlocksField(curr)) {
		curr = {
			...curr,
			blocks: curr.blocks.map((block: BlocksFieldBlock) => ({
				...block,
				fields: [...block.fields].reduce(compile, [])
			}))
		};
	}
	prev.push({ ...curr });
	return prev;
};
