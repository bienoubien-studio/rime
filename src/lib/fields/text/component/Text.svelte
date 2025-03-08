<script lang="ts">
	import { Input } from '$lib/panel/components/ui/input';
	import { Field } from '$lib/panel';
	import type { TextFieldProps } from './props.js';
	import { capitalize } from 'rizom/util/string.js';
	import './text.css';

	const { path, config, type = 'text', form }: TextFieldProps = $props();

	const field = $derived(form.useField(path, config));

	// Actions
	const onInput = (event: Event) => {
		field.value = (event.target as HTMLInputElement).value;
	};

	const classNameTitle = config.isTitle ? 'rz-text-field--title' : '';
	const classNameCompact = config.layout === 'compact' ? 'rz-text-field--compact' : '';
	const classNames = `${config.className} ${classNameTitle || classNameCompact || ''}`;
</script>

<Field.Root class="rz-text-field {classNames}" visible={field.visible} disabled={!field.editable}>
	<Field.Label {config} />
	<Input
		id={path || config.name}
		name={path || config.name}
		placeholder={config.placeholder}
		data-error={field.error ? '' : null}
		{type}
		value={field.value}
		oninput={onInput}
	/>
	<Field.Error error={field.error} />
</Field.Root>
