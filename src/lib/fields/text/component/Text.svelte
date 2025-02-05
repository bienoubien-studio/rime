<script lang="ts">
	import { Input } from '$lib/panel/components/ui/input';
	import { Field } from '$lib/panel';
	import type { TextFieldProps } from './props.js';

	const { path, config, type = 'text', form }: TextFieldProps = $props();

	const field = $derived(form.useField(path, config));

	// Actions
	const onInput = (event: Event) => {
		field.value = (event.target as HTMLInputElement).value;
	};
</script>

<Field.Root class={config.className} visible={field.visible} disabled={!field.editable}>
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
