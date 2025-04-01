import { Node, mergeAttributes } from '@tiptap/core';
import SvelteNodeViewRenderer from '../../svelte/node-view-renderer.svelte';

import CounterComponent from './media.svelte';
import type { Dic } from 'rizom/types/util';

export const Media = Node.create({
  name: 'media',
  group: 'block',
  atom: true,
  draggable: true, // Optional: to make the node draggable
  inline: false,
  
  addOptions() {
      return {
        query: null,
    }
  },
  
  addAttributes() {
    return ['id', 'title', 'sizes', 'mimeType', 'url', 'filename', 'legend'].reduce((acc: Dic, key) => {
      acc[key] = { default: null };
      return acc;
    }, {});
  },

  //@ts-ignore
  addCommands() {
    return {
      insertMedia: (attributes = {}) => 
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
    return [{ tag: 'richt-text-media' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['richt-text-media', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return SvelteNodeViewRenderer(CounterComponent);
  },
});