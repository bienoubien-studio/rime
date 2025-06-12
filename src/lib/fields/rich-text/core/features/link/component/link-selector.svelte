<script lang="ts">
	import type { Editor } from '@tiptap/core';
	import IconButton from '$lib/fields/rich-text/component/bubble-menu/icon-button/icon-button.svelte';
	import { Check, Trash, Link2 } from '@lucide/svelte';
	import { url as validateURL } from '$lib/util/validate.js';
	import Input from '$lib/panel/components/ui/input/input.svelte';
	import type { RichTextContext } from '../../../types';

	type Props = { editor: Editor; context: RichTextContext; active: boolean };
	let { editor, context, active }: Props = $props();

	let value = $state((editor && editor.getAttributes('link').href) || '');
	let error = $state(false);

	let open = $state(false);
	// let active = $state(false);

	$effect(() => {
		if (open) {
			value = (editor && editor.getAttributes('link').href) || '';
		}
	});

	$effect(() => {
		if (!context.bubbleOpen) {
			open = false;
		}
	});

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
	}

	function onDelete() {
		editor.chain().focus().unsetLink().run();
		value = '';
		open = false;
	}
</script>

<div class="rz-link-selector">
	<IconButton icon={Link2} {active} onclick={() => (open = !open)} />

	{#if open}
		<form onsubmit={onSubmit} class="rz-link-selector__form">
			<Input
				oninput={() => {
					if (error && urlState.isValid) error = false;
				}}
				data-error={error || null}
				placeholder="https://"
				bind:value
			/>

			{#if editor.getAttributes('link').href}
				<IconButton icon={Trash} class="rz-link-selector__button" onclick={onDelete} active={false} />
			{:else}
				<IconButton type="submit" active={urlState.isValid} icon={Check} class="rz-link-selector__button"></IconButton>
			{/if}
		</form>
	{/if}
</div>

<style>
	.rz-link-selector {
		position: relative;

		:global(.rz-input) {
			font-size: var(--rz-text-sm);
			border-radius: var(--rz-radius-lg);
		}

		:global(.rz-link-selector__button) {
			position: absolute;
			right: var(--rz-size-1);
			top: var(--rz-size-1);
		}
	}

	.rz-link-selector__form {
		position: fixed;
		top: 100%;
		z-index: 100;
		margin-top: var(--rz-size-1);
		display: flex;
		width: 15rem;
		box-shadow: var(--rz-shadow-xl);
		animation: fadeInSlideFromTop 0.2s ease-out;
		border-radius: var(--rz-radius-lg);
	}

	@keyframes fadeInSlideFromTop {
		from {
			opacity: 0;
			transform: translateY(-0.25rem);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
