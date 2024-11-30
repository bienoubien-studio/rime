import type { AnyField } from 'rizom/types';

export { blocks, block } from './blocks/index.js';
export { checkbox } from './checkbox/index.js';
export { combobox } from './combobox/index.js';
export { component } from './component/index.js';
export { date } from './date/index.js';
export { email } from './email/index.js';
export { group } from './group/index.js';
export { link } from './link/index.js';
export { number } from './number/index.js';
export { radio } from './radio/index.js';
export { relation } from './relation/index.js';
export { richText } from './rich-text/index.js';
export { select } from './select/index.js';
export { separator } from './separator/index.js';
export { slug } from './slug/index.js';
export { tabs, tab } from './tabs/index.js';
export { text } from './text/index.js';
export { toggle } from './toggle/index.js';

export type FieldBluePrint<T extends AnyField = AnyField> = {
	component: any;
	cell?: any;
	toSchema?: (field: T) => string;
	toType?: (field: T) => string;
	match: (field: AnyField) => field is T;
	defaultValue?: any;
	validate?: any;
};
