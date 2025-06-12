import { Node, mergeAttributes } from '@tiptap/core';
import SvelteNodeViewRenderer from '../../svelte/node-view-renderer.svelte';
import CounterComponent from './resource.svelte';
import type { Dic } from '$lib/util/types';

export const Resource = Node.create({
	name: 'resource',
	group: 'block',
	atom: true,
	draggable: true, // Optional: to make the node draggable
	inline: false,

	addOptions() {
		return {
			query: null,
			_type: null
		};
	},

	addAttributes() {
		return ['id', 'title', '_type'].reduce((acc: Dic, key) => {
			acc[key] = { default: null };
			return acc;
		}, {});
	},

	//@ts-expect-error boring
	addCommands() {
		return {
			insertResource:
				(attributes = {}) =>
				//@ts-expect-error boring
				({ commands }) => {
					return commands.insertContent({
						type: this.name,
						attrs: attributes
					});
				}
		};
	},

	parseHTML() {
		return [{ tag: 'richt-text-resource' }];
	},

	renderHTML({ HTMLAttributes }) {
		return ['richt-text-resource', mergeAttributes(HTMLAttributes)];
	},

	addNodeView() {
		return SvelteNodeViewRenderer(CounterComponent);
	}
});
