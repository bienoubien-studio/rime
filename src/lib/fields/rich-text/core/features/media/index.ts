import { FileText } from "@lucide/svelte";
import type { RichTextFeature, RichTextFeatureNode } from "../../types";
import { Media } from "./media-extension.js";
import type { CollectionSlug } from "rizom/types";

const resourceFeatureNode: RichTextFeatureNode = {
  name: 'resource',
  label: 'Media',
  icon: FileText,
  isActive: ({ editor }) => editor.isActive('richt-text-resource'),
  suggestion: {
    //@ts-ignore
    command: ({ editor }) => editor.chain().focus().insertMedia().run()
  }
};

export const MediaFeature = (args: {query: string}): RichTextFeature => ({
  name: 'media',
  extension: Media.configure(args),
  nodes: [resourceFeatureNode]
});