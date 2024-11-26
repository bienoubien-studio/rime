<script lang="ts">
	import * as Tabs from '$lib/panel/components/ui/tabs/index.js';
	import { slugify } from '$lib/utils/string.js';
	import { randomId } from '$lib/utils/random.js';
	import type { DocumentFormContext } from '$lib/panel/context/documentForm.svelte';
	import RenderFields from '../RenderFields.svelte';
	import Cookies from 'js-cookie';
	import type { TabsField } from 'rizom/types/fields';

	type Props = { config: TabsField; path: string; form: DocumentFormContext };
	const { config, path, form }: Props = $props();

	const cookieKey = `Tabs:${config.tabs.map((t) => slugify(t.label)).join('-')}`;

	let tabErrors = $state<string[]>([]);
	const tabIds = $derived(config.tabs.map((tab) => `${slugify(tab.label)}-${randomId(8)}`));

	function onActiveTabChange(value: string | undefined): void {
		value = value || slugify(config.tabs[0].label);
		Cookies.set(cookieKey, value);
		activeTab = value;
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

	let activeTab = $state(Cookies.get(cookieKey) || slugify(config.tabs[0].label));
</script>

<div class="rz-tabs">
	<Tabs.Root onValueChange={onActiveTabChange} value={activeTab}>
		<Tabs.List>
			{#each config.tabs as tab, index}
				<Tabs.Trigger
					disabled={false}
					data-error={tabErrors.includes(tabIds[index]) ? 'true' : null}
					value={slugify(tab.label)}
				>
					{tab.label}
				</Tabs.Trigger>
			{/each}
		</Tabs.List>

		{#each config.tabs as tab, index}
			<Tabs.Content data-tab-id={tabIds[index]} value={slugify(tab.label)}>
				<RenderFields fields={tab.fields} {path} {form} />
			</Tabs.Content>
		{/each}
	</Tabs.Root>
</div>

<style type="postcss">
	.rz-tabs {
		container: rz-tabs / inline-size;

		:global(.rz-tabs-trigger) {
			@container rz-tabs (min-width: 640px) {
				min-width: var(--rz-size-28);
			}
		}

		:global(.rz-tabs-list) {
			margin-bottom: var(--rz-size-4);
		}
	}
</style>
