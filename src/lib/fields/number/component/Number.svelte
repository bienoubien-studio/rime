<script lang="ts">
	import './number.css';
	import { Field } from 'rizom/panel';
	import { ChevronDown, ChevronUp } from 'lucide-svelte';
	import type { NumberFieldProps } from './props';

	const { path, config, form }: NumberFieldProps = $props();

	const field = $derived(form.useField(path, config));
	const initialValue = form.getRawValue(path);

	let value = $state(initialValue);

	const decrease = () => {
		const minValue = config.min ?? -Infinity;
		value = Math.max(value - 1, minValue);
	};

	const increase = () => {
		const maxValue = config.max ?? Infinity;
		value = Math.min(value + 1, maxValue);
	};

	$effect(() => {
		if (value !== field.value) {
			field.value = value;
		}
	});
</script>

{#snippet chevron(Icon: any, func: any, clss: string)}
	<button type="button" class="rz-number__chevron {clss}" onclick={func}>
		<Icon size={12} />
	</button>
{/snippet}

<Field.Root class="rz-number" visible={field.visible} disabled={!field.editable}>
	<Field.Label {config} />
	<Field.Error error={field.error} />
	<div class="rz-number__input-wrapper">
		<input
			class="rz-number__input"
			min={config.min ?? undefined}
			max={config.max ?? undefined}
			bind:value
			type="number"
		/>
		<div class="rz-number__controls">
			{@render chevron(ChevronUp, increase, 'rz-number__chevron--up')}
			{@render chevron(ChevronDown, decrease, 'rz-number__chevron--down')}
		</div>
	</div>
</Field.Root>
