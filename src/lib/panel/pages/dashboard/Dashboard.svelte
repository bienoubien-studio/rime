<script lang="ts">
	import { getConfigContext } from 'rizom/panel/context/config.svelte';
	import type { DashboardEntry } from './load.server.js';
	import Button from 'rizom/panel/components/ui/button/button.svelte';
	import PageHeader from 'rizom/panel/components/ui/page-header/PageHeader.svelte';
	import { getLocaleContext } from 'rizom/panel/context/locale.svelte.js';
	import { ArrowRight, Eye } from 'lucide-svelte';
	import LanguageSwitcher from 'rizom/panel/components/ui/language-switcher/LanguageSwitcher.svelte';
	import { t__ } from 'rizom/panel/i18n/index.js';

	type Props = { entries: DashboardEntry[] };
	const { entries }: Props = $props();

	const config = getConfigContext();

	const locale = getLocaleContext();
</script>

<div class="rz-dashboard">
	{#if config.raw.siteUrl || config.raw.localization}
		<PageHeader>
			<div class="rz-dashboard__header-left">
				{#if config.raw.siteUrl}
					<Button variant="text" target="_blank" icon={Eye} href={config.raw.siteUrl}>
						{t__('common.view_site')}
					</Button>
				{/if}
				{#each config.raw.panel.components.header as CustomHeaderComponent}
					<CustomHeaderComponent />
				{/each}
			</div>
			<LanguageSwitcher />
		</PageHeader>
	{/if}

	{#if config.raw.panel.components.dashboard}
		{@const CustomDashBoard = config.raw.panel.components.dashboard}
		<CustomDashBoard />
	{:else}
		<div class="rz-dashboard__content">
			{#each entries as entry}
				{@const Icon = config.raw.icons[entry.slug]}

				<a href={entry.link}>
					<Icon size="32" />
					<header>
						<h2>{entry.title}</h2>
					</header>

					<!-- {#if entry.prototype === 'collection'}
						{#if entry.lastEdited!.length === 0}
							{t__(`common.no_document|${entry.gender}`, entry.titleSingular)}
						{/if}

						{#if entry.canCreate}
							<Button variant="secondary" href="{entry.link}/create">
								{t__(`common.create_new|${entry.gender}`, entry.titleSingular)}
							</Button>
						{/if}
					{/if} -->
				</a>
			{/each}
		</div>
	{/if}
</div>

<style type="postcss">
	.rz-dashboard {
		/* display: grid;
		gap: var(--rz-size-4); */
		container: rz-dashboard / inline-size;
		background-color: hsl(var(--rz-ground-5) / 0.4);
		min-height: 100vh;

		.rz-dashboard__header-left {
			display: flex;
			gap: var(--rz-size-2);
			align-items: center;
		}

		header {
			a {
				display: flex;
				align-items: center;
				gap: var(--rz-size-3);
			}
			/* margin-top: var(--rz-size-5); */
			/* margin-bottom: var(--rz-size-3); */
		}

		h2 {
			/* @mixin font-semibold; */
			font-size: var(--rz-text-xl);
			@mixin font-light;
			/* border-top: var(--rz-size-2) solid hsl(var(--rz-ground-4)); */
			/* padding-top: var(--rz-size-3); */
		}
	}

	.rz-dashboard__doc {
		/* margin-bottom: var(--rz-size-2); */
		/* padding: var(--rz-size-6); */
		/* border-bottom: var(--rz-border); */
		/* background-color: hsl(var(--rz-ground-6)); */
		/* border-left: var(--rz-border);
		border-right: var(--rz-border); */

		a {
			@mixin font-semibold;
			display: flex;
			align-items: center;
			gap: var(--rz-size-2);
		}
		p {
			color: hsl(var(--rz-ground-2));
			font-size: var(--rz-text-sm);
			@mixin font-light;
		}

		/* &:first-child {
			border-top: var(--rz-border);
			border-radius: var(--rz-radius-md) var(--rz-radius-md) 0 0;
		}
		&:last-child {
			border-radius: 0 0 var(--rz-radius-md) var(--rz-radius-md);
		} */
	}

	.rz-dashboard__content {
		display: grid;
		gap: var(--rz-size-2);
		/* max-width: 1024px; */
		padding: var(--rz-size-8);
		height: 100%;
		grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));

		a {
			height: 100%;
			border: var(--rz-border);
			/* border-bottom: var(--rz-border); */
			border-radius: var(--rz-radius-sm);
			padding: var(--rz-size-4);
			position: relative;
			text-align: center;
			min-height: 180px;
			display: flex;
			gap: var(--rz-size-3);
			flex-direction: column;
			justify-content: center;
			align-items: center;
			transition: background-color 0.3s ease-out;
			background-color: hsl(var(--rz-ground-6));
			&:hover {
				background-color: hsl(var(--rz-ground-7));
			}
			:global(svg) {
				/* position: absolute; */
				opacity: 0.1;
				/* left: 50%;
				top: 50%;
				translate: -50% -50%; */
				z-index: 0;
			}
		}
	}
</style>
