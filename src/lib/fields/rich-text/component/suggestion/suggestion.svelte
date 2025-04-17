<script lang="ts">
	import type { Editor } from '@tiptap/core';
	import * as Command from '$lib/panel/components/ui/command/index.js';
	import { onDestroy, onMount } from 'svelte';
	import type { RichTextFeature } from '../../core/types.js';
	import { capitalize } from '$lib/util/string.js';
	import { t__ } from '$lib/i18n/index.js';

	type Props = {
		editor: Editor;
		features: RichTextFeature[];
		path: string;
	};

	let { editor, features = [], path }: Props = $props();

	let isOpen = $state(false);

	// Get all items with suggestion commands
	const markItems = $derived(
		features
			.flatMap((feature) => feature.marks || [])
			.filter((mark) => mark.suggestion && mark.suggestion.command)
	);

	const nodeItems = $derived(
		features
			.flatMap((feature) => feature.nodes || [])
			.filter((node) => node.suggestion && node.suggestion.command)
	);

	// Combine all suggestion items
	const allSuggestionItems = $derived([...markItems, ...nodeItems]);

	// Cmd+K handling
	const onFocus = () => {
		document.addEventListener('keydown', handleKeyDown);
	};
	const onBlur = () => {
		document.removeEventListener('keydown', handleKeyDown);
	};
	const handleKeyDown = (event: KeyboardEvent) => {
		if (event.code === 'KeyK' && event.metaKey) {
			isOpen = true;
		}
	};

	onMount(() => {
		editor.on('focus', onFocus);
		editor.on('blur', onBlur);
	});

	onDestroy(() => {
		editor.off('focus', onFocus);
		editor.off('blur', onBlur);
	});
</script>

<Command.Dialog bind:open={isOpen}>
	<Command.Input placeholder={t__('common.search')} />

	<Command.List>
		<Command.Empty>No results found.</Command.Empty>

		{#each allSuggestionItems as item}
			{@const ItemIcon = item.icon}
			<Command.Item
				value={item.name}
				onSelect={() => {
					if (item.suggestion && item.suggestion.command) {
						item.suggestion.command({
							editor,
							range: { from: editor.state.selection.from, to: editor.state.selection.to }
						});
					}
					isOpen = false;
				}}
			>
				<div>
					<ItemIcon size={17} />
				</div>
				<div>
					<p>
						{item.label || capitalize(item.name)}
					</p>
				</div>
			</Command.Item>
		{/each}
	</Command.List>
</Command.Dialog>
