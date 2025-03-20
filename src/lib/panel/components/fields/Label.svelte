<script lang="ts">
	import { getLocaleContext } from '$lib/panel/context/locale.svelte';
	import { capitalize } from '$lib/util/string.js';
	import { Label } from '../ui/label/index.js';
	import type { Snippet } from 'svelte';
	import type { AnyFormField } from 'rizom/types/fields';

	type Props = { config?: AnyFormField; children?: Snippet };
	const { config, children }: Props = $props();

	const locale = getLocaleContext();
</script>

<Label class="rz-field-label" title={config?.label ? config.name : null}>
	{#if config}
		{config.label || capitalize(config.name)}
		{#if config.localized}
			<sup>{locale.code}</sup>
		{/if}
	{/if}
	{@render children?.()}
</Label>

<style type="postcss">
	:global {
		.rz-field-label {
			margin-bottom: var(--rz-size-3);
			display: block;
			font-size: var(--rz-text-sm);
			/* color: hsl(var(--rz-ground-1)); */
			/* @mixin font-semibold; */
			letter-spacing: 0.04em;
		}
		.rz-field-label sup {
			font-size: var(--rz-text-2xs);
			text-transform: uppercase;
		}
	}
</style>
