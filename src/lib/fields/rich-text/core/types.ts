import type { CollectionSlug } from '$lib/core/types/doc.js';
import type { IconProps } from '@lucide/svelte';
import type { Editor, EditorOptions, Extension, JSONContent, Mark, Node, Range } from '@tiptap/core';
import type { Component, Snippet } from 'svelte';
import type { RichTextContext } from '../component/context.svelte.js';

export type RichTextFeatureType = 'mark' | 'node';

export type RichTextFeatureSuggestion = {
	command: (args: { editor: Editor; range?: Range }) => void;
};

export type RichTextFeature = {
	name: string;
	extension?: Extension | Node | Mark;
	marks?: RichTextFeatureMark[];
	nodes?: RichTextFeatureNode[];
};

export type RichTextFeatureMark = Omit<RichTextFeatureNode, 'nodeSelector'>;
export type RichTextFeatureNode = {
	name: string;
	label?: string;
	icon: Component<IconProps>;
	isActive?: (args: { editor: Editor; range?: Range }) => boolean;
	nodeSelector?: {
		command: (args: { editor: Editor; range?: Range }) => void;
	};
	bubbleMenu?: {
		command?: (args: { editor: Editor; range?: Range }) => void;
		component?: Component<{ editor: Editor; path: string; active: boolean; context: RichTextContext }>;
	};
	suggestion?: {
		command: (args: { editor: Editor; range?: Range }) => void;
	};
};

type N = '1' | '2' | '3' | '4' | '5' | '6';
export type HeadingFeatureName =
	| 'heading'
	| `heading:${N}`
	| `heading:${N},${N}`
	| `heading:${N},${N},${N}`
	| `heading:${N},${N},${N},${N}`
	| `heading:${N},${N},${N},${N},${N}`
	| `heading:${N},${N},${N},${N},${N},${N}`;

export type MediaFeatureDefinition = `media:${CollectionSlug}${string | ''}`;
export type ResourceFeatureDefinition = `resource:${CollectionSlug}${string | ''}`;
export type PredefinedFeatureName = 'blockquote' | 'bold' | 'italic' | 'ul' | HeadingFeatureName | 'hr' | 'ol' | 'link';

export type RichTextEditorConfig = {
	tiptap: Partial<EditorOptions>;
	features: RichTextFeature[];
};

export interface TiptapNodeViewContext {
	onDragStart: (event: DragEvent) => void;
}

export type ComponentInputProps<T> = Partial<T> & {
	editor: Editor;
	class?: string;
	children?: Snippet;
};

export type RichTextNodeRenderer = Component<{
	node: JSONContent;
	components?: Record<string, RichTextNodeRenderer>;
	children?: Snippet;
}>;

export type { RichTextContext };
