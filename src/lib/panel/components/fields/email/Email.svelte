<script lang="ts">
	import { Input } from '$lib/panel/components/ui/input';
	import type { DocumentFormContext } from '$lib/panel/context/documentForm.svelte';
	import type { FormContext } from '$lib/panel/context/form.svelte';
	import { Field } from '../index';

	import type { EmailField } from 'rizom/types/fields';

	interface Props {
		path?: string;
		config: EmailField;
		type?: 'text' | 'password';
		form: DocumentFormContext | FormContext;
	}
	const { path, config, form }: Props = $props();

	const field = $derived(form.useField(path, config));
	let hasErrorAfterInput = $state(false);

	// Actions
	const onInput = (event: Event) => {
		field.value = (event.target as HTMLInputElement).value;
	};

	const onBlur = () => {
		hasErrorAfterInput = !!field.error;
	};
</script>

<Field.Root visible={field.visible} disabled={form.readOnly}>
	<Field.Label {config} />
	<Input
		id={path || config.name}
		name={path || config.name}
		data-error={hasErrorAfterInput ? '' : null}
		onblur={onBlur}
		value={field.value}
		oninput={onInput}
	/>
	<Field.Error error={hasErrorAfterInput ? field.error : false} />
</Field.Root>
