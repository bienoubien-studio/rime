<script lang="ts">
	import { Switch } from '$lib/panel/components/ui/switch/index.js';
	import * as Sheet from '$lib/panel/components/ui/sheet/index';
	import { Input } from '$lib/panel/components/ui/input';
	import type { DocumentFormContext } from '$lib/panel/context/documentForm.svelte';
	import * as DropdownMenu from '$lib/panel/components/ui/dropdown-menu';
	import { Field } from '../index';
	import Button from '../../ui/button/button.svelte';
	import { capitalize } from '$lib/utils/string.js';
	import { Link2, Newspaper, Anchor, AtSign, Phone, ChevronDown } from 'lucide-svelte';
	import RessourceInput from './RessourceInput.svelte';
	import Label from '../../ui/label/label.svelte';
	import type { LinkField } from 'rizom/types/fields';
	import './link.css';

	type Props = {
		path?: string;
		config: LinkField;
		form: DocumentFormContext;
	};
	const { path, config, form }: Props = $props();

	const icons: Record<string, any> = {
		url: Link2,
		email: AtSign,
		tel: Phone,
		anchor: Anchor
	};

	const placeholders: Record<string, string> = {
		url: 'https://',
		email: 'emile@zola.fr',
		tel: '+330700000000',
		anchor: 'my-anchor'
	};

	const primitiveTypes = ['url', 'email', 'tel', 'anchor'];
	const field = $derived(form.useField(path, config));
	const linkTypes = config.types || ['url', 'email', 'tel', 'anchor'];

	let editing = $state(false);
	const initial = path ? form.getRawValue(path) : null;
	let initialLinkType = initial?.type || linkTypes[0];
	let initialLinkValue = initial?.link || '';
	let initialLabel = initial?.label || '';
	let initialTargetBlank = (initial?.target && initial.target === '_blank') || false;

	let inputValue = $state(initialLinkValue);
	let inputLabelValue = $state(initialLabel);
	let linkType = $state(initialLinkType);
	let linkValue = $state(initialLinkValue);
	let targetBlank = $state(initialTargetBlank);

	let isPrimitiveType = $derived(primitiveTypes.includes(linkType));
	let Icon = $derived(icons[linkType] || Newspaper);
	let placeholder = $derived(placeholders[linkType] || '');
	let ressourceId = $state(!primitiveTypes.includes(initialLinkType) ? initialLinkValue : '');

	let isLinkValueError = $state(false);

	const onInput = (event: Event) => {
		linkValue = (event.target as HTMLInputElement).value;
		setValue();
	};

	const onInputLabel = (event: Event) => {
		inputLabelValue = (event.target as HTMLInputElement).value;
		setValue();
	};

	const onTypeChange = (type: string | undefined) => {
		linkType = type || 'url';
		inputValue = '';
		ressourceId = '';
		setValue();
		if (!form.errors.hasRequired(path || config.name)) {
			form.errors.delete(path || config.name);
		}
	};

	$effect(() => {
		if (!isPrimitiveType && ressourceId !== field.value.link) {
			linkValue = ressourceId;
			setValue();
		}
	});

	const onTargetChange = (value: boolean) => {
		targetBlank = value;
		setValue();
	};

	const setValue = () => {
		field.value = {
			label: inputLabelValue,
			type: linkType,
			link: linkValue,
			target: targetBlank ? '_blank' : '_self'
		};
	};

	$effect(() => {
		const linkTypeError = !!field.error && field.error.includes(`${linkType}::`);
		const requiredError = !!field.error && field.error.includes('required::');
		isLinkValueError = linkTypeError || (requiredError && !linkValue);
	});
</script>

<Field.Root visible={field.visible} disabled={form.readOnly}>
	<Field.Label {config} />

	<div class="rz-link-field">
		<button
			type="button"
			onclick={() => (editing = true)}
			data-error={field.error ? 'true' : 'false'}
			class="rz-link__button"
		>
			<div class="rz-link__type">
				<Icon size={12} />
				{capitalize(linkType)}
			</div>
			<div class="rz-link__label">{inputLabelValue}</div>
			<Button variant="secondary" class="rz-link__edit-button">Edit link</Button>
		</button>

		<Sheet.Root bind:open={editing} onOpenChange={(val) => (editing = val)}>
			<Sheet.Trigger class="hidden" />
			<Sheet.Content class="rz-link__sheet" side="right">
				{#if linkTypes.length > 1}
					<Label class="rz-link__type-label">Type</Label>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Button class="rz-link__type-button" {...props}>
									<Icon size={12} />
									<p class="rz-link__type-text">{capitalize(linkType)}</p>
									<ChevronDown size={9} />
								</Button>
							{/snippet}
						</DropdownMenu.Trigger>

						<DropdownMenu.Content class="rz-link__type-content" align="start">
							<DropdownMenu.RadioGroup onValueChange={onTypeChange} bind:value={linkType}>
								{#each linkTypes as type}
									<DropdownMenu.RadioItem value={type}>
										{capitalize(type)}
									</DropdownMenu.RadioItem>
								{/each}
							</DropdownMenu.RadioGroup>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				{/if}

				<div class="rz-link__input-group">
					<Label class="rz-link__input-label">Label</Label>
					<Input
						class="rz-link__input"
						data-error={field.error && field.error.includes('required::') && !inputLabelValue}
						id="{path || config.name}.label"
						name="{path || config.name}.label"
						value={inputLabelValue}
						placeholder="Link label"
						oninput={onInputLabel}
					/>
					{#if field.error && field.error.includes('required::') && !inputLabelValue}
						<Field.Error error={field.error} />
					{/if}
				</div>

				<div class="rz-link__input-group">
					<Label class="rz-link__input-label">Link</Label>
					{#if isPrimitiveType}
						<Input
							class="rz-link__input"
							data-error={isLinkValueError}
							id={path || config.name}
							name={path || config.name}
							value={inputValue}
							{placeholder}
							oninput={onInput}
						/>
					{:else}
						<RessourceInput
							error={isLinkValueError}
							type={linkType}
							bind:ressourceId
							readOnly={form.readOnly}
						/>
					{/if}
					{#if field.error && (field.error.includes(`${linkType}::`) || field.error.includes('required::')) && !linkValue}
						<Field.Error error={field.error} />
					{/if}
				</div>

				{#if !['anchor', 'email', 'tel'].includes(linkType)}
					<div class="rz-link__target">
						<Switch checked={targetBlank} onCheckedChange={onTargetChange} id="target" />
						<Label class="rz-link__target-label" for="target">Open in new tab</Label>
					</div>
				{/if}
			</Sheet.Content>
		</Sheet.Root>
	</div>
	<Field.Error error={field.error} />
</Field.Root>

<style type="postcss">
	.rz-link-field {
	}

	.rz-link__button {
		background-color: hsl(var(--rz-color-input));
		display: flex;
		height: var(--rz-size-11);
		width: 100%;
		align-items: center;
		justify-content: space-between;
		border-radius: var(--rz-radius-md);
		border: var(--rz-border);
		font-size: var(--rz-text-sm);

		&:global([data-error='true']) {
			@mixin ring var(--rz-color-error);
		}

		.rz-link__type {
			display: flex;
			height: 100%;
			align-items: center;
			gap: var(--rz-size-2);
			border-right: var(--rz-border);
			padding-left: var(--rz-size-3);
			padding-right: var(--rz-size-3);
		}

		.rz-link__label {
			flex: 1;
			padding-left: var(--rz-size-3);
			text-align: left;
		}

		:global(.rz-link__edit-button) {
			margin-right: var(--rz-size-0-5);
			border-top-left-radius: 0;
			border-bottom-left-radius: 0;
		}
	}
</style>
