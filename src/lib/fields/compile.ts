import { FieldBuilder } from './builders/index.js';

import { isBlocksField, isGroupField, isTabsField } from 'rizom/utils/field.js';
import { TabsBuilder, type TabsFieldTab } from './tabs/index.js';
import type { BlocksFieldBlock } from './types.js';
import type { Field } from 'rizom/types/fields.js';
import { BlocksBuilder } from './blocks/index.js';

export const compileFields = (fields: FieldBuilder<Field>[]) => {
	return fields.map((f) => f.compile());
};
