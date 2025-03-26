<script lang="ts">
	import './link-selector.css';
	import type { Editor } from '@tiptap/core';
	import IconButton from '../icon-button/icon-button.svelte';
	import { Check, Trash, Link2 } from '@lucide/svelte';
	import { url as validateURL } from '$lib/util/validate.js';
	import Input from '$lib/panel/components/ui/input/input.svelte';

	type Props = { editor: Editor; isMenuOpen: boolean; };
	let { editor, isMenuOpen }: Props = $props();

	let value = $state((editor && editor.getAttributes('link').href) || '');
	let error = $state(false);

	let open = $state(false)
	let active = $state(false)
	
	$effect(() => {
		if (open) {
			value = (editor && editor.getAttributes('link').href) || '';
		}
	});

	$effect(() => {
		if(!isMenuOpen){
			open = false
		}
	})

	let urlState = $derived.by(() => {
		let transformedUrl = value;
		// Add https:// if needed
		if (value && !value.includes('http')) {
			transformedUrl = `https://${value}`;
		}
		return {
			url: transformedUrl,
			isValid: validateURL(transformedUrl) === true
		};
	});

	function onSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (!urlState.isValid) return (error = true);
		editor.chain().focus().setLink({ href: urlState.url }).run();
		open = false;
		active = true;
	}

	function onDelete() {
		editor.chain().focus().unsetLink().run();
		value = '';
		open = false;
		active = false;
	}
</script>

<div class="rz-link-selector">

	<IconButton
		icon={Link2}
		{active}
		onclick={() => {
			open = !open;
		}}
	/>

	{#if open}
		<form onsubmit={onSubmit} class="rz-link-selector__form">
			<Input
				oninput={() => {
					if (error && urlState.isValid) error = false;
				}}
				data-error={error || null}
				placeholder="Paste a link"
				bind:value
			/>

			{#if editor.getAttributes('link').href}
				<IconButton
					icon={Trash}
					class="rz-link-selector__button"
					onclick={onDelete}
					active={false}
				/>
			{:else}
				<IconButton
					type="submit"
					active={urlState.isValid}
					icon={Check}
					class="rz-link-selector__button"
				></IconButton>
			{/if}
		</form>
	{/if}
</div>
