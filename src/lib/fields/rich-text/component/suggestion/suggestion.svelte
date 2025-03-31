<script lang="ts">
	import type { Editor } from '@tiptap/core';
	import * as Command from '$lib/panel/components/ui/command/index.js';
	import { onDestroy, onMount } from 'svelte';
	import type { RichTextFeature } from '../../core/types.js';
	import { capitalize } from 'rizom/util/string.js';
	import { t__ } from 'rizom/panel/i18n/index.js';
		
	type Props = {
		editor: Editor;
		features: RichTextFeature[];
		path: string;
	};

	let { editor, features = [], path }: Props = $props();
	
	let isOpen = $state(false);

	// Get all items with suggestion commands
	const markItems = $derived(
		features.flatMap(feature => feature.marks || [])
			.filter(mark => mark.suggestion && mark.suggestion.command)
	);
	
	const nodeItems = $derived(
		features.flatMap(feature => feature.nodes || [])
			.filter(node => node.suggestion && node.suggestion.command)
	);
	
	// Combine all suggestion items
	const allSuggestionItems = $derived([...markItems, ...nodeItems]);

	// Cmd+K handling
	const onFocus = () => {
		document.addEventListener('keydown', handleKeyDown)
	}
	const onBlur = () => {
		document.removeEventListener('keydown', handleKeyDown)
	}
	const handleKeyDown = (event: KeyboardEvent) => {
		if(event.code === 'KeyK' && event.metaKey){
			isOpen = true;
		}
	}

	onMount(() => {
		editor.on('focus', onFocus)
		editor.on('blur', onBlur)
	});

	onDestroy(() => {
		editor.off('focus', onFocus)
		editor.off('blur', onBlur)
	})

</script>

<Command.Dialog bind:open={isOpen}>
	<Command.Input class="rz-suggestion__search" placeholder={t__('common.search')} />

	<Command.List class="rz-suggestion__list">
		<Command.Empty>No results found.</Command.Empty>
		<Command.Group heading="Component">
			{#each allSuggestionItems as item}
				{@const ItemIcon = item.icon}
				<Command.Item
					class="rz-suggestion__item"
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
					<div class="rz-suggestion__icon-wrapper">
						<ItemIcon size={17} />
					</div>
					<div class="rz-suggestion__info">
						<p class="rz-suggestion__title">
							{item.label || capitalize(item.name)}
						</p>
					</div>
				</Command.Item>
			{/each}
		</Command.Group>
	</Command.List>
</Command.Dialog>
