<script lang="ts">
	import * as Tabs from '$lib/panel/components/ui/tabs/index.js';
	import type { DocumentFormContext } from '$lib/panel/context/documentForm.svelte';
	import Cookies from 'js-cookie';
	import RenderFields from 'rizom/panel/components/fields/RenderFields.svelte';
	import type { TabsFieldRaw } from '../index.js';

	type Tab = TabsFieldRaw['tabs'][number];
	type Props = { config: TabsFieldRaw; path: string; form: DocumentFormContext };

	const { config, path: initialPath, form }: Props = $props();

	const cookieKey = `Tabs:${initialPath}:${config.tabs.map((t) => t.name).join('-')}`;
	let activeTabName = $state(Cookies.get(cookieKey) || config.tabs[0].name);

	// Prevent empty tab on live open
	// if localstorage tab.live is false
	$effect(() => {
		if (form.isLive) {
			const currentActiveTab = config.tabs.find((tab) => tab.name === activeTabName);
			if (!currentActiveTab || currentActiveTab.live === false) {
				activeTabName = config.tabs[0].name;
			}
		}
	});

	let tabErrors = $state<string[]>([]);
	const tabIds = $derived(
		config.tabs.map((tab) => `${tab.name}-${new Date().getTime().toString()}`)
	);

	function onActiveTabChange(value: string | undefined): void {
		value = value || config.tabs[0].name;
		Cookies.set(cookieKey, value);
		activeTabName = value;
	}

	$effect(() => {
		if (form.errors.length) {
			const errorsTabs = document.querySelectorAll<HTMLElement>(
				'.rz-tabs-content:has(*[data-error])'
			);
			if (errorsTabs) {
				tabErrors = Array.from(errorsTabs)
					.map((el: HTMLElement) => (el.dataset.tabId ? el.dataset.tabId : false))
					.filter((entry) => typeof entry === 'string');
			}
		} else {
			tabErrors = [];
		}
	});

	const path = $derived(initialPath === '' ? '' : `${initialPath}.`);

	function isTabVisible(tab: Tab) {
		return form.isLive ? tab.live === true : true;
	}
</script>

<div class="rz-tabs">
	<Tabs.Root onValueChange={onActiveTabChange} value={activeTabName}>
		<Tabs.List>
			{#each config.tabs.filter(isTabVisible) as tab, index}
				<Tabs.Trigger
					data-error={tabErrors.includes(tabIds[index]) ? 'true' : null}
					value={tab.name}
				>
					{tab.label || tab.name}
				</Tabs.Trigger>
			{/each}
		</Tabs.List>

		{#each config.tabs.filter(isTabVisible) as tab, index}
			<Tabs.Content data-tab-id={tabIds[index]} value={tab.name}>
				<RenderFields fields={tab.fields} path="{path}{tab.name}" {form} />
			</Tabs.Content>
		{/each}
	</Tabs.Root>
</div>

<style type="postcss">
	.rz-tabs :global {

		.rz-tabs-trigger {
			min-width: var(--rz-size-28);
		}

		.rz-tabs-content {
			margin-top: var(--rz-size-8);
		}

		.rz-tabs-list {
			position: sticky;
			top: 0;
			margin-bottom: 0;
			z-index: 10;
		}
	}
</style>
