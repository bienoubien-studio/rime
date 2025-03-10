<script lang="ts">
	import type { DocumentFormContext } from 'rizom/panel/context/documentForm.svelte';
	import Button from '../../ui/button/button.svelte';
	import SpinLoader from '../../ui/spin-loader/SpinLoader.svelte';
	import { ChevronLeft, Command } from '@lucide/svelte';
	import { t__ } from 'rizom/panel/i18n/index.js';
	import ButtonSave from './ButtonSave.svelte';

	type Props = { form: DocumentFormContext; onClose: any };
	const { form, onClose }: Props = $props();
</script>

<div class="rz-floating-ui">
	<Button icon={ChevronLeft} onclick={onClose} variant="secondary" size="icon"></Button>
	<ButtonSave
		class="rz-floating-ui__save"
		disabled={!form.canSubmit}
		processing={form.processing}
	/>
</div>

<style>
	.rz-floating-ui {
		position: absolute;
		bottom: var(--rz-size-4);
		left: var(--rz-size-4);
		background-color: hsl(var(--rz-ground-5));
		padding: var(--rz-size-2);
		right: var(--rz-size-4);
		border-radius: var(--rz-radius-md);
		z-index: 1000;
		display: flex;
		gap: var(--rz-size-2);

		:global(.rz-floating-ui__save) {
			flex: 1;
		}
	}
</style>
