<script lang="ts">
	import { getLocaleContext } from '$lib/panel/context/locale.svelte.js';
	import { capitalize } from '$lib/util/string.js';
	import { Label } from '../ui/label/index.js';
	import type { AnyFormField } from '$lib/fields/types.js';

	type Props = { config: AnyFormField; for: string };
	const { config, for: labelFor }: Props = $props();

	const locale = getLocaleContext();
</script>

<Label class="rz-field-label-for" for={labelFor}>
	{config.label || capitalize(config.name)}
	{#if config.localized}
		<sup>{locale.code}</sup>
	{/if}
</Label>

<style type="postcss">
	:global {
		fieldset:disabled .rz-field-label-for {
			cursor: no-drop;
		}
		.rz-field-label-for {
			cursor: pointer;
			margin-bottom: 0;
			@mixin font-semibold;
		}
		.rz-field-label-for sup {
			font-size: var(--rz-text-2xs);
			text-transform: uppercase;
		}
	}
</style>
