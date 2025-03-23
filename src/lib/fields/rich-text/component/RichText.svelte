<script lang="ts">
	import './rich-text.css';
	import { onMount } from 'svelte';
	import { Editor } from '@tiptap/core';
	import EditorBubbleMenu from './bubble-menu/bubble-menu.svelte';
	import { buildEditorConfig } from './editor.config.js';
	import { Field } from 'rizom/panel/components/fields/index.js';
	import type { RichTextFieldProps } from './props.js';
	import { root } from 'rizom/panel/components/fields/root.svelte.js';

	const { path, config, form, class: className }: RichTextFieldProps = $props();

	let element: HTMLElement;
	const key = `richtext-${new Date().getTime().toString()}`;

	let editor = $state<Editor>();
	const field = $derived(form.useField(path, config));

	onMount(() => {
		const editorConfig = buildEditorConfig({
			element,
			config,
			editable: !form.readOnly,
			onFocus: () => form.setFocusedField(path),
			setValue: (val: any) => (field.value = val)
		});

		editor = new Editor(editorConfig);

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
			<EditorBubbleMenu nodes={config.nodes} marks={config.marks} {editor} />
		{/key}
	{/if}
</fieldset>
