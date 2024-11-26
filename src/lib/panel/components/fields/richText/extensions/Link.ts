import Link from '@tiptap/extension-link';

export const RichTextLink = Link.extend({ inclusive: false }).configure({
	openOnClick: false,
	HTMLAttributes: {
		class: 'rz-rich-text-link'
	}
});
