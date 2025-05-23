<script lang="ts">
	import type { DocumentFormContext } from '$lib/panel/context/documentForm.svelte';
	import Button from '../../ui/button/button.svelte';
	import { ChevronLeft } from '@lucide/svelte';
	import ButtonSave from './ButtonSave.svelte';
	import LanguageSwitcher from '../../ui/language-switcher/LanguageSwitcher.svelte';
	import { env } from '$env/dynamic/public';
	import type { GenericDoc } from '$lib/core/types/doc.js';
	import { toast } from 'svelte-sonner';

	type Props = { form: DocumentFormContext; onClose: any };
	const { form, onClose }: Props = $props();

	function onLocaleClick (code:string) {
		fetch(`${env.PUBLIC_RIZOM_URL}/api/${form.config.slug}?where[id][equals]=${form.doc.id}&select=url&locale=${code}`)
				.then((response) => response.json())
				.then((data: { docs: GenericDoc[] }) => {
						if(Array.isArray(data.docs) && data.docs.length){
							const url = data.docs[0].url
							window.location.href = url + '?live=1'
						}
					}
				).catch(err => {
					toast.error(`an error occured getting ${code} url`)
					console.error(err)
				})
	}

</script>

<div class="rz-floating-ui">
	<Button icon={ChevronLeft} onclick={onClose} variant="secondary" size="icon"></Button>
	<ButtonSave
		class="rz-floating-ui__save"
		disabled={!form.canSubmit}
		processing={form.processing}
	/>
	
	{#if form.config.url}
		<LanguageSwitcher onLocalClick={onLocaleClick}  />
	{/if}

</div>

<style>
	.rz-floating-ui {
		position: sticky;
		width: calc(100% - var(--rz-size-4));
		bottom: var(--rz-size-2);
		margin-left: var(--rz-size-2);
		margin-right: var(--rz-size-2);
		height: var(--rz-size-14);
		background-color: hsl(var(--rz-ground-5));
		padding: var(--rz-size-2);
		border-radius: var(--rz-radius-md);
		z-index: 1000;
		display: flex;
		gap: var(--rz-size-2);

		:global(.rz-floating-ui__save) {
			flex: 1;
		}
	}
</style>
