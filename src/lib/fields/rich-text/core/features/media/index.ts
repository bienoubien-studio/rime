import { Images } from '@lucide/svelte';
import type { RichTextFeature, RichTextFeatureNode } from '../../types.js';
import { Media } from './media-extension.js';

const mediaFeatureNode: RichTextFeatureNode = {
	name: 'media',
	label: 'Media',
	icon: Images,
	isActive: ({ editor }) => editor.isActive('richt-text-media'),
	suggestion: {
		//@ts-expect-error insertMedia is defined by the extension
		command: ({ editor }) => editor.chain().focus().insertMedia().run()
	}
};

export const MediaFeature = (args: { query: string }): RichTextFeature => ({
	name: 'media',
	extension: Media.configure(args),
	nodes: [mediaFeatureNode]
});
