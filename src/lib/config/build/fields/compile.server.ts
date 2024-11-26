import { FieldBuilder } from '$lib/config/fields/index.js';
import type { GenericBlock } from 'rizom/types/doc';

export const compile = (prev: any[], curr: any) => {
	// console.log('-----------');
	// console.log(curr);
	// console.log(curr instanceof FieldBuilder);
	if (curr instanceof FieldBuilder) {
		curr = curr.toField();
	}
	if (curr.type === 'tabs') {
		curr = {
			...curr,
			tabs: curr.tabs.map((tab: any) => ({
				...tab,
				fields: tab.fields.reduce(compile, [])
			}))
		};
	} else if (curr.type === 'group') {
		curr = {
			...curr,
			fields: curr.fields.reduce(compile, [])
		};
	} else if (curr.type === 'blocks') {
		curr = {
			...curr,
			blocks: curr.blocks.map((block: GenericBlock) => ({
				...block,
				fields: [...block.fields].reduce(compile, [])
			}))
		};
	}
	prev.push({ ...curr });
	return prev;
};
