<script lang="ts">
	import * as Command from '$lib/panel/components/ui/command/index.js';
	import type { GenericDoc, PrototypeSlug } from 'rizom/types';
	import { t__ } from 'rizom/panel/i18n/index.js';
	import Tag from 'rizom/panel/components/ui/tag/tag.svelte';

	type Ressource = {
		label: string;
		id: string;
		_prototype: 'area' | 'collection';
	};

	type Props = {
		ressourceId: string | null;
		readOnly: boolean;
		type: PrototypeSlug;
		error: boolean;
	};

	let { ressourceId = $bindable(), type: ressourceType, readOnly, error }: Props = $props();

	let search = $state('');
	let inputFocused = $state(false);
	let ressources = $state<Ressource[]>([]);
	let selected = $state<Ressource | null>();

	const getRessources = async (slug: string) => {
		const res = await fetch(`/api/${slug}`, {
			method: 'GET',
			headers: {
				'content-type': 'application/json'
			}
		});
		if (res.ok) {
			const response = await res.json();
			const docs = 'docs' in response ? response.docs : [response.doc];
			const ressources: Ressource[] = docs.map((doc: GenericDoc) => ({
				id: doc.id,
				label: doc._prototype === 'collection' ? doc.title : doc._type,
				_prototype: doc._prototype
			}));
			if (ressourceId) {
				selected = ressources.find((ressource) => ressource.id === ressourceId);
			}
			return ressources;
		}
		return [];
	};

	$effect(() => {
		getRessources(ressourceType)
			.then((result) => {
				ressources = result;
			})
			.then(() => {
				if (ressources[0]._prototype === 'area') {
					selected = ressources[0];
				}
			});
	});

	$effect(() => {
		if (selected) {
			ressourceId = selected.id;
		}
	});

	$effect(() => {
		if (!ressourceId) {
			selected = null;
		}
	});

	function removeRessource() {
		selected = null;
		ressourceId = null;
	}
</script>

<div class="rz-ressource-input">
	<Command.Root>
		<div
			class="rz-ressource-input__wrapper"
			class:rz-ressource-input__wrapper--readonly={readOnly}
			data-focused={inputFocused ? '' : null}
			data-error={error ? '' : null}
		>
			{#if selected}
				<Tag onRemove={removeRessource} {readOnly}>
					{selected.label}
				</Tag>
			{/if}

			{#if !readOnly && !selected}
				<Command.InputSelect
					onfocus={() => (inputFocused = true)}
					onblur={() => setTimeout(() => (inputFocused = false), 200)}
					bind:value={search}
					placeholder={t__('common.search_a', ressourceType)}
				/>
				{#if inputFocused}
					<Command.List>
						{#each ressources as ressource}
							<Command.Item
								value={ressource.label}
								onSelect={() => {
									selected = ressource;
									search = '';
								}}
							>
								<span>{ressource.label}</span>
							</Command.Item>
						{/each}
						{#if ressources.length === 0}
							<Command.Empty>No {ressourceType}</Command.Empty>
						{/if}
					</Command.List>
				{/if}
			{/if}
		</div>
	</Command.Root>
</div>

<style type="postcss">
	.rz-ressource-input {
		position: relative;
		width: 100%;

		:global(.rz-command) {
			width: 100%;
			border-radius: var(--rz-radius-md);
		}

		:global(.rz-command-list) {
			background-color: hsl(var(--rz-color-input));
			border: var(--rz-border);
			border-radius: var(--rz-radius-md);
			position: absolute;
			left: 0;
			right: 0;
			top: var(--rz-size-12);
			z-index: 10;
			box-shadow: var(--rz-shadow-md);
		}

		:global(.rz-command-input-select) {
			cursor: text;
		}

		:global(.rz-command-item) {
			height: var(--rz-size-10);
		}
	}

	.rz-ressource-input__wrapper {
		background-color: hsl(var(--rz-color-input));
		display: flex;
		height: var(--rz-size-11);
		flex-wrap: wrap;
		align-items: center;
		gap: var(--rz-size-1);
		border: var(--rz-border);
		border-top: 0;
		padding: var(--rz-size-2) var(--rz-size-3);
	}

	.rz-ressource-input__wrapper--readonly {
		cursor: no-drop;
	}

	.rz-ressource-input__wrapper:global([data-focused]) {
		/* --rz-ring-offset: 1px; */
		@mixin ring var(--rz-color-primary);
		z-index: 20;
	}

	.rz-ressource-input__wrapper:global([data-error]) {
		@mixin ring var(--rz-color-error);
	}
</style>
