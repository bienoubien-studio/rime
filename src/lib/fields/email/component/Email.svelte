<script lang="ts">
	import { Input } from '$lib/panel/components/ui/input';
	import { Field } from 'rizom/panel';
	import type { EmailFieldProps } from './props';
	import { capitalize } from 'rizom/utils/string';

	const { path, config, form }: EmailFieldProps = $props();

	const field = $derived(form.useField(path, config));
	let showError = $state(false);

	// Actions
	const onInput = (event: Event) => {
		showError = false;
		field.value = (event.target as HTMLInputElement).value;
	};

	const onBlur = () => {
		showError = true;
	};
</script>

<Field.Root class={config.className} visible={field.visible} disabled={!field.editable}>
	<Field.Label {config} />
	<Input
		id={path || config.name}
		name={path || config.name}
		placeholder={capitalize(config.label || config.name)}
		data-error={showError && field.error ? '' : null}
		value={field.value}
		onblur={onBlur}
		oninput={onInput}
	/>
	<Field.Error error={(showError && field.error) || false} />
</Field.Root>
