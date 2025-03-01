<script lang="ts">
	import './rich-text.css';
	import { onMount } from 'svelte';
	import { Editor } from '@tiptap/core';
	import EditorBubbleMenu from './bubble-menu/bubble-menu.svelte';
	import { buildEditorConfig } from './editor.config';
	import { Field } from 'rizom/panel';
	import type { RichTextFieldProps } from './props';

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

		console.log(typeof field.value);
		if (field.value?.content) {
			editor.commands.setContent(field.value.content);
		}
	});
</script>

<Field.Root class={config.className} visible={field.visible} disabled={!field.editable}>
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
</Field.Root>
