<script lang="ts">
	import './styles/rich-text.css';
	import { onMount } from 'svelte';
	import { Editor } from '@tiptap/core';
	import EditorBubbleMenu from './bubble-menu/bubble-menu.svelte';
	import { buildConfig } from '../core/index.js';
	import { Field } from 'rizom/panel/components/fields/index.js';
	import type { RichTextFieldProps } from './props.js';
	import { root } from 'rizom/panel/components/fields/root.svelte.js';
	import type { RichTextEditorConfig, RichTextModifier } from '../core/types';

	const { path, config, form, class: className }: RichTextFieldProps = $props();

	let element: HTMLElement;
	const key = `richtext-${new Date().getTime().toString()}`;

	let editor = $state<Editor>();
	let marks = $state<RichTextModifier[]>()
	let nodes = $state<RichTextModifier[]>()
	let bubbleMenuExtras = $state<RichTextEditorConfig['bubbleMenu']>()
	
	const field = $derived(form.useField(path, config));
	
	onMount(() => {
		const richTextEditorConfig = buildConfig({
			element,
			config,
			editable: !form.readOnly,
			onFocus: () => form.setFocusedField(path),
			setValue: (val: any) => (field.value = val)
		});

		marks = richTextEditorConfig.marks
		nodes = richTextEditorConfig.nodes
		bubbleMenuExtras = richTextEditorConfig.bubbleMenu
		editor = new Editor(richTextEditorConfig.tiptapConfig);

		if (field.value?.content) {
			editor.commands.setContent(field.value.content);
		}
	});
</script>

<fieldset class="rz-field-rich-text {config.className || ''}" use:root={field}>
	<Field.Label {config} />
	<Field.Error error={field.error} />
	<div
		bind:this={element}
		data-error={field.error ? 'true' : null}
		class="rz-rich-text__editor {className}"
	></div>
	{#if editor && editor.isEditable}
		{#key key}
			<EditorBubbleMenu extras={bubbleMenuExtras} nodes={nodes} marks={marks} {editor} />
		{/key}
	{/if}
</fieldset>
