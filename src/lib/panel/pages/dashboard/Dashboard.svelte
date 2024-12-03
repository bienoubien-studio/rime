<script lang="ts">
	import { getConfigContext } from 'rizom/panel/context/config.svelte';
	import type { DashboardEntry } from './load.server.js';
	import Button from 'rizom/panel/components/ui/button/button.svelte';
	import PageHeader from 'rizom/panel/components/ui/page-header/PageHeader.svelte';
	import { getLocaleContext } from 'rizom/panel/context/locale.svelte.js';

	import { ArrowRight, Eye } from 'lucide-svelte';
	import LanguageSwitcher from 'rizom/panel/components/ui/language-switcher/LanguageSwitcher.svelte';

	// import PageHeader from 'rizom/panel/components/ui/page-header/PageHeader.svelte';

	type Props = { entries: DashboardEntry[] };
	const { entries }: Props = $props();

	const configContext = getConfigContext();
	const config = configContext;

	const locale = getLocaleContext();
</script>

<div class="rz-dashboard">
	<PageHeader>
		<Button variant="text" icon={Eye} href={config.raw.siteUrl}>View site</Button>
		<LanguageSwitcher />
	</PageHeader>

	<div class="rz-dashboard__content">
		{#each entries as entry}
			{@const Icon = config.raw.icons[entry.slug]}
			<section>
				<header>
					<a href={entry.link}>
						<h2>{entry.title}</h2>
						<ArrowRight size="13" />
					</a>
				</header>

				{#if entry.prototype === 'collection'}
					{#if entry.lastEdited!.length === 0}
						You don't have any {entry.titleSingular}
					{/if}
					{#if entry.lastEdited}
						<ul>
							{#each entry.lastEdited as doc}
								<li class="rz-dashboard__doc">
									<a href="/panel/{doc._type}/{doc.id}">
										<Icon size="12" />
										{doc.title}
										<p>Last update : {locale.dateFormat(doc.updatedAt!, true)}</p>
									</a>
								</li>
							{/each}
						</ul>
					{/if}
					{#if entry.canCreate}
						<Button variant="secondary" href="{entry.link}/create"
							>Create new {entry.titleSingular}</Button
						>
					{/if}
				{/if}
			</section>
		{/each}
	</div>
</div>

<style type="postcss">
	.rz-dashboard {
		/* display: grid;
		gap: var(--rz-size-4); */
		container: rz-dashboard / inline-size;
		background-color: hsl(var(--rz-ground-5) / 0.4);
		min-height: 100vh;

		header {
			a {
				display: flex;
				align-items: center;
				gap: var(--rz-size-3);
			}
			margin-top: var(--rz-size-5);
			/* margin-bottom: var(--rz-size-3); */
		}

		h2 {
			@mixin font-semibold;
			font-size: var(--rz-text-2xl);
			/* border-top: var(--rz-size-2) solid hsl(var(--rz-ground-4)); */
			/* padding-top: var(--rz-size-3); */
		}
	}

	.rz-dashboard__doc {
		/* margin-bottom: var(--rz-size-2); */
		padding: var(--rz-size-4);
		border-bottom: var(--rz-border);
		background-color: hsl(var(--rz-ground-6));
		border-left: var(--rz-border);
		border-right: var(--rz-border);

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

		&:first-child {
			border-top: var(--rz-border);
			border-radius: var(--rz-radius-md) var(--rz-radius-md) 0 0;
		}
		&:last-child {
			border-radius: 0 0 var(--rz-radius-md) var(--rz-radius-md);
		}
	}

	section {
		display: flex;
		flex-direction: column;
		gap: 1rem;

		:global(.rz-button) {
			align-self: start;
		}
	}

	.rz-dashboard__content {
		display: grid;
		gap: var(--rz-size-8);
		padding-top: var(--rz-size-4);
		max-width: 1024px;
		@mixin px var(--rz-size-8);
	}
</style>
