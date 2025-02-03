<script lang="ts">
	import type { DocumentFormContext } from 'rizom/panel/context/documentForm.svelte';
	import Button from '../../ui/button/button.svelte';
	import SpinLoader from '../../ui/spin-loader/SpinLoader.svelte';
	import { ChevronLeft, Command } from 'lucide-svelte';
	import { __t } from 'rizom/panel/i18n';

	type Props = { form: DocumentFormContext; onClose: any };
	const { form, onClose }: Props = $props();
</script>

<div class="rz-floating-ui">
	<Button icon={ChevronLeft} onclick={onClose} variant="secondary" size="icon"></Button>
	<Button class="rz-floating-ui__save" type="submit" disabled={!form.canSubmit}>
		{__t('common.save')}
		{#if form.processing}
			<SpinLoader />
		{:else}
			<span>
				<Command size="9" /> + S
			</span>
		{/if}
	</Button>
</div>

<style>
	.rz-floating-ui {
		position: fixed;
		bottom: var(--rz-size-4);
		left: var(--rz-size-4);
		background-color: hsl(var(--rz-ground-5));
		padding: var(--rz-size-2);
		width: calc(var(--rz-live-sidebar-width) - var(--rz-size-8));
		border-radius: var(--rz-radius-md);
		z-index: 1000;
		display: flex;
		gap: var(--rz-size-2);
		:global(.rz-floating-ui__save) {
			flex: 1;
			span {
				font-size: var(--rz-text-xs);
				display: flex;
				align-items: center;
				gap: 2px;
				border: 1px solid currentColor;
				padding: 0 4px;
				border-radius: var(--rz-radius-sm);
			}
		}
	}
</style>
