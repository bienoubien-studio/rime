<script lang="ts">
	import type { NodeViewProps } from '@tiptap/core';
	import type { UploadDoc } from 'rizom/types/doc.js';
	import * as Command from '$lib/panel/components/ui/command/index.js';
	import * as Dialog from '$lib/panel/components/ui/dialog/index.js';
	import { onMount } from 'svelte';
	import { setAPIProxyContext } from 'rizom/panel/context/api-proxy.svelte';
	import UploadThumbCell from 'rizom/panel/components/sections/collection/upload-thumb-cell/UploadThumbCell.svelte';
	import NodeViewWrapper from '../../svelte/node-view-wrapper.svelte';
	import Button from 'rizom/panel/components/ui/button/button.svelte';
	import Input from 'rizom/panel/components/ui/input/input.svelte';

	type NodeAttributes = {
		id: string | null;
		title: string | null;
		slug: string | null
	};

	let { node, updateAttributes, extension }: NodeViewProps = $props();
	let isDialogOpen = $state(false);
	let selected = $state<NodeAttributes | null>();
	
	const handleClick = () => {
		isDialogOpen = true;
	};

	onMount(() => {
		if (node.attrs.id) {
			selected = {
				id: node.attrs.id,
				title: node.attrs.title,
				slug: node.attrs.slug
			};
		} else {
			selected = null;
			isDialogOpen = true;
		}
	});

	// Need to set a local APIProxy because the app one is not
	// available from inside tiptap rendered components
	// TODO try to pass it as a prop in a near future
	const APIProxy = setAPIProxyContext('titap');
	const ressource = APIProxy.getRessource(`/api/${extension.options.query}`);
	let docs = $state<UploadDoc[]>([]);

	$effect(() => {
		if (ressource.data) {
			docs = ressource.data.docs;
		}
	});

	// Handle dialog selection
	function handleResourceSelection(doc: UploadDoc) {
		// Close the dialog
		isDialogOpen = false;

		// Update the selected media
		selected = doc;
		
		// Update node attributes
		updateNodeAttributes();
	}

	// Handle removing media
	function removeResource() {
		selected = null;
		
		// Update node attributes with empty values
		updateAttributes({
			id: null,
			title: null,
			slug: null
		});
	}

	// Update node attributes based on current state
	function updateNodeAttributes() {
		if (!selected) return;

		updateAttributes({
			id: selected.id,
			title: selected.title,
			slug : extension.options.slug
		} as NodeAttributes);
	}
	
</script>

<NodeViewWrapper>
	<div data-drag-handle class="rz-richtext-media" class:rz-richtext-media--selected={!!selected}>
		{#if !selected}
			<Button variant="outline" onclick={handleClick}>Add a resource</Button>
		{:else}
			{selected.id}
			<!-- {@render media(selected)} -->
		{/if}
	</div>
</NodeViewWrapper>

<Command.Dialog bind:open={isDialogOpen} onOpenChange={(val) => (isDialogOpen = val)}>
	<Command.Input placeholder="Select a resource" />

	<Command.List>
		<Command.Empty>No results found.</Command.Empty>
		{#each docs as doc}
			<Command.Item
				value={doc.filename}
				onSelect={() => {
					handleResourceSelection(doc);
				}}
			>
				{doc.title}
			</Command.Item>
		{/each}
	</Command.List>
</Command.Dialog>



<style lang="postcss">
	:global(.ProseMirror-selectednode .rz-richtext-media) {
		
		&::after{
			content: '';
			position:absolute;
			inset:0;
			mix-blend-mode:screen;
			background-color: hsl(var(--rz-color-primary) / 0.6);
			pointer-events: none;
		}

		.rz-richtext-media__actions {
			display: flex;
		}
	}
	.rz-richtext-media {
		position: relative;
	}
	
	.rz-richtext-media__actions {
		position: absolute;
		font-size: var(--rz-text-sm);
		right: var(--rz-size-3);
		top: var(--rz-size-3);
		display: none;
		gap: var(--rz-size-2);
	}
	.rz-richtext-media__button.rz-richtext-media__button-remove {
		width: var(--rz-size-5);
		padding: 0;
	}
	.rz-richtext-media__button {
		padding: 0 var(--rz-size-2);
		border: var(--rz-border);
		background-color: hsl(var(--rz-ground-6));
		border-radius: 1rem;
		height: var(--rz-size-5);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.rz-richtext-media__legend{
		font-style: italic;
		font-size: var(--rz-text-sm);
		opacity: 0.5;
	}
</style>
