import { type EditorOptions } from '@tiptap/core';
import type { RichTextField } from '../index.js';
import type { RichTextEditorConfig } from './types.js';
import { buildConfigFromString, buildDefaultConfig } from './config-builders.js';

type BuildEditorConfig = (args: {
	config: RichTextField;
	element: HTMLElement;
	editable: boolean;
	setValue: (value: any) => void;
	onFocus?: any;
}) => {
	tiptapConfig: Partial<EditorOptions>,
	marks: RichTextEditorConfig['marks'], 
	nodes: RichTextEditorConfig['nodes'], 
	bubbleMenu: RichTextEditorConfig['bubbleMenu']
};

export const buildConfig: BuildEditorConfig = ({
	config,
	element,
	editable,
	setValue,
	onFocus
}) => {
	let rizomRichtextConfig: RichTextEditorConfig
	if(typeof config.tiptap === 'string'){
		rizomRichtextConfig = buildConfigFromString(config.tiptap)
	}else{
		rizomRichtextConfig = config.tiptap ? config.tiptap({ config, element }) : buildDefaultConfig({ config, element })
	}
	const tiptapConfig = rizomRichtextConfig.tiptap
	
	if('onUpdate' in rizomRichtextConfig.tiptap){
		tiptapConfig.onUpdate = (props) => {
			rizomRichtextConfig.tiptap.onUpdate!(props)
			setValue(props.editor.getJSON())
		}
	}else{
		tiptapConfig.onUpdate = (props) => {
			setValue(props.editor.getJSON())
		}
	}
	
	if (onFocus) {
		tiptapConfig.onFocus = onFocus;
	}

	if (!tiptapConfig.element) {
		tiptapConfig.element = element;
	}
	if (!tiptapConfig.editable) {
		tiptapConfig.editable = editable;
	}

	return {
		tiptapConfig,
		marks: rizomRichtextConfig.marks || [],
		nodes: rizomRichtextConfig.nodes || [],
		bubbleMenu: {
			components: rizomRichtextConfig.bubbleMenu?.components || []
		}
	};
};

