import { Images } from '@lucide/svelte';
import type { RichTextFeature, RichTextFeatureNode } from '../../types.js';
import { Resource } from './resource-extension.js';

const resourceFeatureNode: RichTextFeatureNode = {
	name: 'resource',
	label: 'Resource',
	icon: Images,
	isActive: ({ editor }) => editor.isActive('richt-text-resource'),
	suggestion: {
		//@ts-expect-error boring
		command: ({ editor }) => editor.chain().focus().insertResource().run()
	}
};

export const ResourceFeature = (args: { query: string; slug: string }): RichTextFeature => ({
	name: 'Resource',
	extension: Resource.configure(args),
	nodes: [resourceFeatureNode]
});
