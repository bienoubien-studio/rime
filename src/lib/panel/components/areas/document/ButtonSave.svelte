<script lang="ts">
	import { t__ } from 'rizom/panel/i18n';
	import Button from '../../ui/button/button.svelte';
	import SpinLoader from '../../ui/spin-loader/SpinLoader.svelte';
	import { Command } from 'lucide-svelte';

	type Props = { disabled: boolean; processing: boolean; class?: string };

	const { disabled, processing, class: className }: Props = $props();
</script>

<Button class={className || null} type="submit" {disabled}>
	{#if processing}
		<SpinLoader />
	{:else}
		<span>
			<Command size="9" /> + S
		</span>
	{/if}
	{t__('common.save')}
</Button>

<style>
	span {
		font-size: var(--rz-text-xs);
		display: flex;
		opacity: 0.65;
		align-items: center;
		gap: 2px;
		border: 1px solid currentColor;
		padding: 0 4px;
		border-radius: var(--rz-radius-sm);
	}
</style>
