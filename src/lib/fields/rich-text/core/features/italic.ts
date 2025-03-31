import { ItalicIcon } from "@lucide/svelte";
import type { RichTextFeature, RichTextFeatureMark } from "../types";
import Italic from "@tiptap/extension-italic";

const italicItem: RichTextFeatureMark = {
  name: 'italic',
  label: 'Italic',
  icon: ItalicIcon,
  isActive: ({ editor }) => editor.isActive('italic'),
  bubbleMenu: {
    command: ({ editor }) => editor.chain().focus().toggleItalic().run()
  }
};

export const ItalicFeature: RichTextFeature = {
  name: 'italic',
  extension: Italic,
  marks: [italicItem]
};