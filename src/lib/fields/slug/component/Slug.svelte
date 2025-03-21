<script lang="ts">
	import { Input } from '$lib/panel/components/ui/input';
	import { slugify } from '$lib/util/string.js';
	import type { DocumentFormContext } from '$lib/panel/context/documentForm.svelte';
	import Button from 'rizom/panel/components/ui/button/button.svelte';
	import type { SlugField } from '../index';
	import { Field } from 'rizom/panel';
	import { t__ } from 'rizom/panel/i18n/index.js';
	import { getValueAtPath } from 'rizom/util/object';
	import './slug.css';
	import { Hash } from '@lucide/svelte';

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
			const fromValue = getValueAtPath<string>(config.slugify, source);
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

	const classNameCompact = config.layout === 'compact' ? 'rz-slug-field--compact' : '';
	const classNames = `${config.className} ${classNameCompact || ''}`;
</script>

<Field.Root class={classNames} visible={field.visible} disabled={!field.editable}>
	<Field.Label {config} />

	<div class="rz-slug">
		<Hash class="rz-slug__icon" size="12" />
		<Input
			placeholder={config.placeholder}
			data-error={field.error ? '' : null}
			type="text"
			value={field.value}
			oninput={onInput}
		/>
		{#if config.slugify}
			<Button onclick={generateFromField} type="button" size="sm" variant="outline">
				{t__('fields.generate_from', config.slugify)}
			</Button>
		{/if}
	</div>
	<Field.Error error={field.error} />
</Field.Root>
