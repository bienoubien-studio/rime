<script lang="ts">
	import * as RadioGroup from '$lib/panel/components/ui/radio-group/index.js';
	import { Label } from '$lib/panel/components/ui/label/index.js';
	import { Field } from '../index.js';
	import type { DocumentFormContext } from '$lib/panel/context/documentForm.svelte';
	import { capitalize } from '$lib/utils/string.js';
	import type { RadioField } from 'rizom/types/fields.js';
	import './radio.css';

	type Props = { path: string; config: RadioField; form: DocumentFormContext };

	const { path, config, form }: Props = $props();

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

<Field.Root visible={field.visible} disabled={form.readOnly}>
	<Field.Label {config} />
	<RadioGroup.Root bind:value class="rz-radio">
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
