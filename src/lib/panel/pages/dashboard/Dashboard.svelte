<script lang="ts">
	import { ArrowUpRight, Eye, Home } from '@lucide/svelte';
	import Button from '$lib/panel/components/ui/button/button.svelte';
	import PageHeader from '$lib/panel/components/ui/page-header/PageHeader.svelte';
	import { getConfigContext } from '$lib/panel/context/config.svelte';
	import LanguageSwitcher from '$lib/panel/components/ui/language-switcher/LanguageSwitcher.svelte';
	import { t__ } from '$lib/core/i18n/index.js';
	import type { DashboardEntry } from './types.js';
	import { invalidateAll } from '$app/navigation';
	import type { User } from '$lib/core/collections/auth/types.js';
	import Page from '$lib/panel/components/sections/page-layout/Page.svelte';

	type Props = { entries: DashboardEntry[]; user?: User };
	const { entries, user }: Props = $props();

	const config = getConfigContext();
</script>

<Page>
	{#snippet main()}
		<div class="rz-dashboard">
			<PageHeader>
				{#snippet title()}
					{t__('common.welcome')} {user!.name}
				{/snippet}

				{#snippet topRight()}
					{#if config.raw.siteUrl}
						<Button variant="text" target="_blank" icon={Eye} href={config.raw.siteUrl}>
							{t__('common.view_site')}
						</Button>
					{/if}
					{#each config.raw.panel.components.header as CustomHeaderComponent, index (index)}
						<CustomHeaderComponent />
					{/each}
					{#if config.raw.localization}
						<LanguageSwitcher onLocalClick={() => invalidateAll()} />
					{/if}
				{/snippet}
			</PageHeader>

			{#if config.raw.panel.components.dashboard}
				{@const CustomDashBoard = config.raw.panel.components.dashboard}
				<CustomDashBoard {entries} />
			{:else}
				<div class="rz-dashboard__content">
					{#each entries as entry, index (index)}
						{@const Icon = config.raw.icons[entry.slug]}
						<a class="rz-dashboard__entry" href={entry.link}>
							<div class="rz-dashboard__entry-icon">
								<Icon size="16" strokeWidth="1" />
							</div>
							<div>
								<header>
									<h2>{entry.title}</h2>
									<ArrowUpRight strokeWidth="1" size="18" />
								</header>
								{#if entry.description}
									<p class="rz-dashboard__entry-description">{entry.description}</p>
								{/if}
							</div>
						</a>
					{/each}
				</div>
			{/if}
		</div>
	{/snippet}
</Page>

<style type="postcss">
	.rz-dashboard {
		background-color: hsl(var(--rz-ground-5) / 0.4);
		min-height: 100vh;

		h2 {
			font-size: var(--rz-text-xl);
			@mixin font-medium;
		}
	}
	.rz-dashboard__entry {
		height: 100%;
		background-color: hsl(var(--rz-ground-6));
		border-radius: var(--rz-radius-sm);
		padding: var(--rz-size-4);
		position: relative;
		min-height: 180px;
		display: flex;
		flex-direction: column;
		gap: var(--rz-size-4);
		transition: background-color 0.3s ease-out;

		--rz-ring-offset-bg: var(--rz-ground-5);
		--rz-ring-offset: 4px;
		@mixin ring var(--rz-ground-4);

		&:hover {
			background-color: hsl(var(--rz-ground-7) / 0.7);
		}

		:global(svg) {
			opacity: 0.7;
			z-index: 0;
		}

		header {
			display: flex;
			align-items: center;
			gap: var(--rz-size-2);
		}
	}
	.rz-dashboard__entry-icon {
		width: var(--rz-size-10);
		height: var(--rz-size-10);
		background-color: hsl(var(--rz-ground-7));
		border-radius: var(--rz-size-10);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.rz-dashboard__entry-description {
		opacity: 0.5;
		margin-top: var(--rz-size-1);
	}

	.rz-dashboard__content {
		display: grid;
		gap: var(--rz-size-7);
		padding: var(--rz-size-8) var(--rz-page-gutter);
		height: 100%;
		grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
	}
</style>
