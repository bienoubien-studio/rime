import { FieldBuilder } from '$lib/config/fields/index.js';
import type { BlocksFieldBlock, TabsFieldTab } from 'rizom/types';

import { isBlocksField, isGroupField, isTabsField } from 'rizom/utils/field';

export const compile = (prev: any[], curr: any) => {
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
