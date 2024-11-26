<script lang="ts">
	import * as Card from 'rizom/panel/components/ui/card';
	import { getConfigContext } from 'rizom/panel/context/config.svelte';
	import type { DashboardEntry } from './load.server.js';
	import Button from 'rizom/panel/components/ui/button/button.svelte';
	// import DashboardSearch from './DashboardSearch.svelte';

	type Props = { entries: DashboardEntry[] };
	const { entries }: Props = $props();

	const configContext = getConfigContext();
	// const user = getUserContext();
	const { config } = configContext;
</script>

<div class="rz-dashboard">
	{#if config.siteUrl}
		<Button target="_blank" href={config.siteUrl} class="rz-dashboard__button-site">
			View site
		</Button>
	{/if}

	<!-- <h1 class="rz-dashboard__title">Welcome {user.attributes.name}</h1> -->
	<!-- <DashboardSearch /> -->

	<div class="rz-dashboard__content">
		{#each entries as entry}
			{@const Icon = config.icons[entry.slug]}
			<Card.Root>
				<Card.Header>
					<Icon size="14" />
					<h2>{entry.title}</h2>
				</Card.Header>
				<Card.Footer>
					{#if entry.prototype === 'collection'}
						<Button size="sm" variant="outline" href={entry.link}>View all</Button>
						{#if entry.canCreate}
							<Button size="sm" variant="outline" href="{entry.link}/create">Create new</Button>
						{/if}
					{:else}
						<Button size="sm" variant="outline" href={entry.link}>Edit</Button>
					{/if}
				</Card.Footer>
			</Card.Root>
		{/each}
	</div>
</div>

<style type="postcss">
	.rz-dashboard {
		display: grid;
		gap: var(--rz-size-4);
		container: rz-dashboard / inline-size;
		padding: var(--rz-size-8);
		@mixin px var(--rz-size-8);
		@mixin py var(--rz-size-8);

		:global(.rz-dashboard__button-site) {
			position: absolute;
			top: var(--rz-size-8);
			right: var(--rz-size-8);
		}

		:global(.rz-card-header) {
			display: flex;
			align-items: center;
			gap: var(--rz-size-2);
		}
	}

	/* .rz-dashboard__title {
		margin-bottom: var(--rz-size-12);
		font-size: var(--rz-text-2xl);
		@mixin font-medium;
	} */
	.rz-dashboard__content {
		display: grid;
		gap: var(--rz-size-4);
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		max-width: 1024px;
	}
</style>
