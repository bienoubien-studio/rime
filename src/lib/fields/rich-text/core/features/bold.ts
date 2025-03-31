// /Users/ai/Dev/rizom/src/lib/fields/rich-text/core/features/bold.ts
import { BoldIcon } from "@lucide/svelte";
import type { RichTextFeature, RichTextFeatureMark } from "../types";
import Bold from "@tiptap/extension-bold";

// Create the bold extension
const boldExtension = Bold.configure({
  HTMLAttributes: { class: 'rz-rich-text-bold' }
});

// Create bold feature item
const boldItem: RichTextFeatureMark = {
  name: 'bold',
  label: 'Bold',
  icon: BoldIcon,
  isActive: ({ editor }) => editor.isActive('bold'),
  bubbleMenu: {
    command: ({ editor }) => editor.chain().focus().toggleBold().run()
  }
};

// Export the bold feature
export const BoldFeature: RichTextFeature = {
  name: 'bold',
  extension: boldExtension,
  marks: [boldItem]
};