import { LinkIcon } from '@lucide/svelte';
import type { RichTextFeature, RichTextFeatureMark } from '../../types';
import Link from '@tiptap/extension-link';
import LinkSelector from './component/link-selector.svelte';

// Create the link extension
const linkExtension = Link.configure({
	openOnClick: false,
	HTMLAttributes: { class: 'rz-rich-text-link' }
});

// Create link feature item
const linkItem: RichTextFeatureMark = {
	name: 'link',
	label: 'Link',
	icon: LinkIcon,
	isActive: ({ editor }) => editor.isActive('link'),
	bubbleMenu: {
		component: LinkSelector
	}
};

// Export the link feature
export const LinkFeature: RichTextFeature = {
	name: 'link',
	extension: linkExtension,
	marks: [linkItem]
};
