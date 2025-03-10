<script lang="ts">
	import { t__ } from 'rizom/panel/i18n/index.js';
	import Button from '../../ui/button/button.svelte';
	import SpinLoader from '../../ui/spin-loader/SpinLoader.svelte';
	import { Save } from '@lucide/svelte';

	type Props = { disabled: boolean; processing: boolean; class?: string };

	const { disabled, processing, class: className }: Props = $props();
</script>

<Button class={className || null} type="submit" {disabled}>
	{#if processing}
		<SpinLoader />
	{:else}
		<Save size="13" />
	{/if}
	{t__('common.save')}
</Button>
