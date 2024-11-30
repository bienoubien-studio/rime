import { FieldBuilder } from '../field-builder.js';
import type { SeparatorField } from './index.js';
import type { AnyField } from 'rizom/types';
import Separator from './component/Separator.svelte';

export const blueprint = {
	component: Separator,
	match: (field: AnyField): field is SeparatorField => field.type === 'separator'
};

export const separator = () => new FieldBuilder<SeparatorField>('separator');
