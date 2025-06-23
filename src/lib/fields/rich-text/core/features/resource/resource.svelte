<script lang="ts">
	import type { NodeViewProps } from '@tiptap/core';
	import type { GenericDoc } from '$lib/core/types/doc.js';
	import * as Command from '$lib/panel/components/ui/command/index.js';
	import { onMount } from 'svelte';
	import { API_PROXY, setAPIProxyContext } from '$lib/panel/context/api-proxy.svelte';
	import NodeViewWrapper from '../../svelte/node-view-wrapper.svelte';
	import Button from '$lib/panel/components/ui/button/button.svelte';
	import CardResource from '$lib/panel/components/ui/card-resource/card-resource.svelte';

	type NodeAttributes = {
		id: string | null;
		title: string | null;
		_type: string | null;
	};

	type RequiredNodeAttributes = {
		id: string;
		title: string;
		_type: string;
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
				_type: node.attrs._type
			};
		} else {
			selected = null;
			isDialogOpen = true;
		}
	});

	// Need to set a local APIProxy because the app one is not
	// available from inside tiptap rendered components
	// TODO try to pass it as a prop in a near future
	const APIProxy = setAPIProxyContext(API_PROXY.TIPTAP);
	const ressource = APIProxy.getRessource(`/api/${extension.options.query}`);
	let docs = $state<GenericDoc[]>([]);

	$effect(() => {
		if (ressource.data) {
			docs = ressource.data.docs;
			// Update atttributes if document title has changed
			if (node.attrs.id) {
				selected = docs.find((doc) => doc.id === node.attrs.id);
			}
		}
	});

	// Handle dialog selection
	function handleResourceSelection(doc: GenericDoc) {
		// Close the dialog
		isDialogOpen = false;

		// Update the selected resource
		selected = doc;

		// Update node attributes
		updateNodeAttributes();
	}

	// Handle removing resource
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
			_type: extension.options.slug
		} as NodeAttributes);
	}
</script>

<NodeViewWrapper>
	<div data-drag-handle class="rz-richtext-media" class:rz-richtext-media--selected={!!selected}>
		{#if !selected}
			<Button variant="outline" onclick={handleClick}>Add a resource</Button>
		{:else}
			<CardResource resource={selected as RequiredNodeAttributes} onCloseClick={removeResource} />
		{/if}
	</div>
</NodeViewWrapper>

<Command.Dialog bind:open={isDialogOpen} onOpenChange={(val) => (isDialogOpen = val)}>
	<Command.Input placeholder="Select a resource" />

	<Command.List>
		<Command.Empty>No results found.</Command.Empty>
		{#each docs as doc, index (index)}
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
		&::after {
			content: '';
			position: absolute;
			inset: 0;
			mix-blend-mode: screen;
			background-color: hsl(var(--rz-color-primary) / 0.6);
			pointer-events: none;
		}
	}
	.rz-richtext-media {
		position: relative;
	}
</style>
