<script lang="ts">
	import { Input } from '$lib/panel/components/ui/input';
	import type { DocumentFormContext } from '$lib/panel/context/documentForm.svelte';
	import type { FormContext } from '$lib/panel/context/form.svelte';
	import { Field } from '../index';

	import type { TextField } from 'rizom/types/fields';

	type Props = {
		path?: string;
		config: TextField;
		type?: 'text' | 'password';
		form: DocumentFormContext | FormContext;
	};
	const { path, config, type = 'text', form }: Props = $props();

	const field = $derived(form.useField(path, config));

	// Actions
	const onInput = (event: Event) => {
		field.value = (event.target as HTMLInputElement).value;
	};

	//
</script>

<Field.Root visible={field.visible} disabled={form.readOnly}>
	<Field.Label {config} />
	<Input
		id={path || config.name}
		name={path || config.name}
		data-error={field.error ? '' : null}
		{type}
		value={field.value}
		oninput={onInput}
	/>
	<Field.Error error={field.error} />
</Field.Root>
