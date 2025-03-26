import type { IconProps } from "@lucide/svelte";
import type { Editor, EditorOptions } from "@tiptap/core";
import type { Component } from "svelte";
import type { RichTextField } from "../index.js";

export type SetEditorConfig = (args: {
	config: RichTextField;
	element: HTMLElement;
}) => RichTextEditorConfig;

export type RichTextModifier = {
	name: string,
	label?: string,
	command: (editor:Editor) => any,
	isActive: (editor:Editor) => boolean;
	icon: Component<IconProps>
}

export type RichTextEditorConfig = {
	tiptap: Partial<EditorOptions>,
	marks?: RichTextModifier[],
	nodes?: RichTextModifier[],
	bubbleMenu?:{
		components: Component<{editor:Editor, isMenuOpen:boolean}>[]
	}
}