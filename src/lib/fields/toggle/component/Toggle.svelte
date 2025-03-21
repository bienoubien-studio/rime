<script lang="ts">
	import './toggle.css';
	import { Switch } from '$lib/panel/components/ui/switch/index.js';
	import { Field } from 'rizom/panel';
	import type { ToggleProps } from './props';
	import { slugify } from 'rizom/util/string';

	const { path, config, form }: ToggleProps = $props();

	const field = $derived(form.useField(path, config));

	// Actions
	const onCheckedChange = (bool: boolean) => {
		field.value = bool;
	};

	const inputId = `${form.key}-${slugify(path)}`;
</script>

<Field.Root
	class="rz-toggle-field {config.className || ''}"
	visible={field.visible}
	disabled={!field.editable}
>
	<Switch
		data-error={field.error ? '' : null}
		checked={field.value}
		{onCheckedChange}
		id={inputId}
	/>
	<Field.LabelFor {config} for={inputId} />
</Field.Root>
