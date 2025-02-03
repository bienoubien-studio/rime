<script lang="ts">
	import * as Command from '$lib/panel/components/ui/command/index.js';
	import { X } from 'lucide-svelte';
	import { dataFocused } from 'rizom/panel/utility/dataFocused';
	import { dataError } from 'rizom/panel/utility/dataError';
	import type { GenericDoc, PrototypeSlug } from 'rizom/types';
	import { __t } from 'rizom/panel/i18n';

	type Ressource = {
		label: string;
		id: string;
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
				label: doc.title
			}));
			if (ressourceId) {
				selected = ressources.find((ressource) => ressource.id === ressourceId);
			}
			return ressources;
		}
		return [];
	};

	$effect(() => {
		getRessources(ressourceType).then((out) => (ressources = out));
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
</script>

<div class="rz-ressource-input">
	<Command.Root>
		<div
			class="rz-ressource-input__wrapper"
			class:rz-ressource-input__wrapper--readonly={readOnly}
			use:dataFocused={inputFocused}
			use:dataError={error}
		>
			{#if selected}
				<div
					class="rz-ressource-input__selected"
					class:rz-ressource-input__selected--readonly={readOnly}
				>
					<span>{selected.label}</span>
					<button
						class="rz-ressource-input__remove"
						class:rz-ressource-input__remove--readonly={readOnly}
						type="button"
						onclick={() => {
							selected = null;
							ressourceId = null;
						}}
					>
						<X size={13} />
					</button>
				</div>
			{/if}

			{#if !readOnly}
				<Command.InputSelect
					onfocus={() => (inputFocused = true)}
					onblur={() => setTimeout(() => (inputFocused = false), 150)}
					class="rz-ressource-input__search {selected ? 'rz-ressource-input__search--hidden' : ''}"
					bind:value={search}
					placeholder={__t('common.search_a', ressourceType)}
				/>

				{#if inputFocused}
					<Command.List class="rz-ressource-input__list">
						{#each ressources as ressource}
							<Command.Item
								class="rz-ressource-input__item"
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
		& :global(.rz-command) {
			width: 100%;
			border-radius: var(--rz-radius-md);
		}
	}

	.rz-ressource-input__wrapper {
		@mixin bg color-input;
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
		--rz-ring-offset: 1px;
		@mixin ring var(--rz-color-primary);
		z-index: 20;
	}

	.rz-ressource-input__wrapper:global([data-error]) {
		@mixin ring var(--rz-color-error);
	}

	.rz-ressource-input__selected {
		background-color: hsl(var(--rz-ground-0));
		@mixin color ground-4;
		display: flex;
		align-items: center;
		gap: var(--rz-size-2);
		border-radius: var(--rz-radius-sm);
		padding: 0.18rem var(--rz-size-2);
		font-size: var(--rz-text-xs);
	}

	.rz-ressource-input__selected--readonly {
		opacity: 0.3;
		cursor: no-drop;
	}

	.rz-ressource-input__remove {
		cursor: pointer;
	}

	.rz-ressource-input__remove--readonly {
		cursor: no-drop;
	}
	/*
	.rz-ressource-input__search {
		border-radius: 0;
	}

	.rz-ressource-input__search--hidden {
		display: none;
	}

	.rz-ressource-input__list {
		@mixin bg color-input;
		position: absolute;
		left: 0;
		right: 0;
		top: var(--rz-size-12);
		z-index: 20;
		border-bottom-left-radius: var(--rz-radius-md);
		border-bottom-right-radius: var(--rz-radius-md);
		border: var(--rz-border);
		box-shadow: var(--rz-shadow-md);
	}

	.rz-ressource-input__item {
		height: var(--rz-size-11);
	} */
</style>
