<script lang="ts">
	import { Input } from '$lib/panel/components/ui/input';
	import { slugify } from '$lib/utils/string.js';
	import type { DocumentFormContext } from '$lib/panel/context/documentForm.svelte';
	import Button from 'rizom/panel/components/ui/button/button.svelte';
	import type { SlugField } from '../index';
	import { Field } from 'rizom/panel';

	type Props = { path: string; config: SlugField; form: DocumentFormContext };
	const { path, config, form }: Props = $props();

	const field = $derived(form.useField(path, config));
	const initialValue = form.getRawValue(path);
	const initialEmpty = !initialValue;
	let internalValue = $state(initialValue);

	$effect(() => {
		if (initialEmpty) {
			generateFromField();
		}
	});

	$effect(() => {
		if (internalValue !== field.value) {
			field.value = internalValue;
		}
	});

	const generateFromField = () => {
		if (config.slugify) {
			const source = config.slugify in form.changes ? form.changes : form.doc;
			const fromValue = source[config.slugify];
			if (!fromValue) return;
			const slugifiedValue = slugify(fromValue);
			if (internalValue !== slugifiedValue) {
				internalValue = slugifiedValue;
			}
		}
	};

	const onInput = (event: Event) => {
		const inputElement = event.target as HTMLInputElement;
		const inputValue = inputElement.value;
		const slugifiedValue = slugify(inputValue.replace(' ', '-'));
		if (inputValue !== slugifiedValue) {
			inputElement.value = slugifiedValue;
		}
		internalValue = inputElement.value;
	};
</script>

<Field.Root visible={field.visible} disabled={form.readOnly}>
	<Field.Label {config} />

	<div class="rz-slug">
		<Input data-error={field.error ? '' : null} type="text" value={field.value} oninput={onInput} />
		{#if config.slugify}
			<Button onclick={generateFromField} type="button" size="sm" variant="outline">
				Generate from {config.slugify}
			</Button>
		{/if}
	</div>
	<Field.Error error={field.error} />
</Field.Root>

<style type="postcss">
	.rz-slug {
		position: relative;

		:global(.rz-input) {
			font-family: var(--rz-font-mono);
			font-size: var(--rz-text-sm);
		}

		:global(.rz-button) {
			position: absolute;
			right: var(--rz-size-1-5);
			top: var(--rz-size-1-5);
		}
	}
</style>
