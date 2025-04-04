<script lang="ts">
	import { Link } from '@lucide/svelte';
	import type { DocumentFormContext } from 'rizom/panel/context/documentForm.svelte';
	
	const { form }: { form: DocumentFormContext<any> }= $props();
</script>

{#if form.config.url}
	<a href={form.config.url(form.doc) || null} class="rz-comp-url" target="_blank">
		<Link size="12" />
		{form.config.url(form.doc)}
	</a>
{/if}

<style>
	.rz-comp-url {
		background-color: hsl(var(--rz-ground-4) / 1);
		color: hsl(var(--rz-ground-1) / 1);
		border-radius: var(--rz-radius-md);
		border: var(--rz-border);
		display: inline-flex;
		gap: var(--rz-size-3);
		justify-content: flex-start;
		align-items: center;
		/* font-family: monospace; */
		letter-spacing: 0.02em;
		font-size: var(--rz-text-sm);
		margin: 0 var(--rz-fields-padding);
		padding: var(--rz-size-1) var(--rz-size-3);
		border: 1px solid hsl(var(--rz-ground-2) / 0.2);
	}
</style>
