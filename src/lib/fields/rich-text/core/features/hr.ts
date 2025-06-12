import { SeparatorHorizontal } from '@lucide/svelte';
import type { RichTextFeature, RichTextFeatureMark } from '../types';
import HorizontalRule from '@tiptap/extension-horizontal-rule';

const hrItem: RichTextFeatureMark = {
	name: 'hr',
	label: 'Horizontal Rule',
	icon: SeparatorHorizontal,
	isActive: () => false,
	suggestion: {
		command: ({ editor }) => editor.chain().focus().setHorizontalRule().run()
	}
};

export const HorizontalRuleFeature: RichTextFeature = {
	name: 'horizontal-rule',
	extension: HorizontalRule,
	nodes: [hrItem]
};
