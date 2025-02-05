<script lang="ts">
	import './radio.css';
	import * as RadioGroup from '$lib/panel/components/ui/radio-group/index.js';
	import { Label } from '$lib/panel/components/ui/label/index.js';
	import { Field } from 'rizom/panel';
	import { capitalize } from '$lib/utils/string.js';
	import type { RadioFieldProps } from './props.js';
	const { path, config, form }: RadioFieldProps = $props();

	const field = $derived(form.useField(path, config));

	let initialValue =
		form.getRawValue(path) || config.defaultValue ? config.defaultValue : undefined;
	let value = $state<string | undefined>(initialValue);

	$effect(() => {
		if (value && value !== field.value) {
			field.value = value;
		}
	});
</script>

<Field.Root class={config.className} visible={field.visible} disabled={!field.editable}>
	<Field.Label {config} />
	<RadioGroup.Root bind:value class="rz-radio" disabled={!field.editable}>
		{#each config.options as option, index}
			<div class="rz-radio__option">
				<RadioGroup.Item value={option.value} id="r{index}" class="rz-radio__input" />
				<Label class="rz-radio__label" for="r{index}">
					{option.label || capitalize(option.value)}
				</Label>
			</div>
		{/each}
	</RadioGroup.Root>
	<Field.Error error={field.error} />
</Field.Root>
