import { Node, mergeAttributes } from '@tiptap/core';
import SvelteNodeViewRenderer from '../../svelte/node-view-renderer.svelte';
import CounterComponent from './resource.svelte';
import type { Dic } from 'rizom/types/util';

export const Resource = Node.create({
  name: 'resource',
  group: 'block',
  atom: true,
  draggable: true, // Optional: to make the node draggable
  inline: false,
  
  addOptions() {
      return {
        query: null,
        slug: null,
    }
  },
  
  addAttributes() {
    return ['id', 'title', 'slug'].reduce((acc: Dic, key) => {
      acc[key] = { default: null };
      return acc;
    }, {});
  },

  //@ts-ignore
  addCommands() {
    return {
      insertResource: (attributes = {}) => 
        //@ts-ignore
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: attributes
          })
        }
    }
  },
  
  parseHTML() {
    return [{ tag: 'richt-text-resource' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['richt-text-resource', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return SvelteNodeViewRenderer(CounterComponent);
  },
});