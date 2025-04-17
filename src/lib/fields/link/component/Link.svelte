<script lang="ts">
	import { Link2, Newspaper, Anchor, AtSign, Phone, ChevronDown } from '@lucide/svelte';
	import { Switch } from '$lib/panel/components/ui/switch/index.js';
	import { Input } from '$lib/panel/components/ui/input/index.js';
	import * as DropdownMenu from '$lib/panel/components/ui/dropdown-menu/index.js';
	import { Field } from '$lib/panel/components/fields/index.js';
	import Button from '$lib/panel/components/ui/button/button.svelte';
	import { capitalize } from '$lib/util/string.js';
	import RessourceInput from './RessourceInput.svelte';
	import Label from '$lib/panel/components/ui/label/label.svelte';
	import { t__ } from '$lib/i18n/index.js';
	import { root } from '$lib/panel/components/fields/root.svelte.js';
	import type { LinkFieldProps } from './props';
	import type { Link } from '../types';

	const { path, config, form }: LinkFieldProps = $props();

	const icons: Record<string, any> = {
		url: Link2,
		email: AtSign,
		tel: Phone,
		anchor: Anchor
	};

	const placeholders: Record<string, string> = {
		url: 'https://',
		email: 'email@zola.fr',
		tel: '+330700000000',
		anchor: 'my-anchor'
	};

	const primitiveTypes = ['url', 'email', 'tel', 'anchor'];
	const field = $derived(form.useField(path, config));
	const linkTypes = config.types || ['url', 'email', 'tel', 'anchor'];
	const initial = path ? form.getRawValue(path) : null;

	let initialLinkType = initial?.type || linkTypes[0];
	let initialLinkValue = initial?.value || '';
	let initialTargetBlank = (initial?.target && initial.target === '_blank') || false;

	let inputValue = $state(initialLinkValue);
	let linkType = $state(initialLinkType);
	let linkValue = $state(initialLinkValue);
	let targetBlank = $state(initialTargetBlank);

	let isPrimitiveType = $derived(primitiveTypes.includes(linkType));
	let Icon = $derived(icons[linkType] || Newspaper);
	let placeholder = $derived(placeholders[linkType] || '');
	let ressourceId = $state(!primitiveTypes.includes(initialLinkType) ? initialLinkValue : '');
	const hasTarget = $derived(!['anchor', 'email', 'tel'].includes(linkType));

	let isLinkValueError = $state(false);
	let isLinkRequiredError = $derived(!!field.error && field.error.includes(`required::`));

	const onInput = (event: Event) => {
		linkValue = (event.target as HTMLInputElement).value;
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
		if (!isPrimitiveType) {
			if( (field.value && ressourceId !== field.value.value) || !field.value && ressourceId ){
				linkValue = ressourceId;
				setValue();
			}
		}
	});

	const onTargetChange = (value: boolean) => {
		targetBlank = value;
		setValue();
	};

	const setValue = () => {
		const value: Link = {
			type: linkType,
			value: linkValue,
			target: targetBlank ? '_blank' : '_self'
		};
		field.value = value
	};

	$effect(() => {
		const linkTypeError = !!field.error && field.error.includes(`${linkType}::`);
		isLinkValueError = linkTypeError || (isLinkRequiredError && !linkValue);
	});
</script>

<fieldset class={config.className} use:root={field}>
	{#if config.layout !== 'compact'}
		<Field.Label {config} />
	{/if}

	<div
		class:rz-link-field--compact={config.layout === 'compact'}
		class="rz-link-field"
		data-error={field.error ? 'true' : 'false'}
	>
		<div
			class="rz-link-field__bottom"
			style="--rz-corner-radius:{hasTarget ? 0 : 'var(--rz-radius-md)'}"
		>

			<!-- Type -->
			 {#if linkTypes.length === 1}
					<Button class="rz-link__type-single" variant="secondary">
						<Icon class="rz-link__type-icon" size={12} />
						<p class="rz-link__type-text">{capitalize(linkType)}</p>
					</Button>
			 {:else}
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props })}
						<Button variant="secondary" {...props}>
							<Icon class="rz-link__type-icon" size={12} />
							<p class="rz-link__type-text">{capitalize(linkType)}</p>
							<ChevronDown class="rz-link__type-icon" size={12} />
						</Button>
					{/snippet}
				</DropdownMenu.Trigger>

				<DropdownMenu.Portal>
					<DropdownMenu.Content class="rz-link__type-content" align="start">
						<DropdownMenu.RadioGroup onValueChange={onTypeChange} bind:value={linkType}>
							{#each linkTypes as type}
								<DropdownMenu.RadioItem value={type}>
									{capitalize(type)}
								</DropdownMenu.RadioItem>
							{/each}
						</DropdownMenu.RadioGroup>
					</DropdownMenu.Content>
				</DropdownMenu.Portal>
			</DropdownMenu.Root>
			{/if}
			<!-- Value -->

			{#if isPrimitiveType}
				<Input
					id={path || config.name}
					name={path || config.name}
					data-error={isLinkValueError ? '' : null}
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

			<!-- Target -->
			{#if hasTarget}
				<div class="rz-link__target">
					<Switch checked={targetBlank} onCheckedChange={onTargetChange} id="target" />
					<Label for="target">{t__('fields.new_tab')}</Label>
				</div>
			{/if}
		</div>
	</div>

	<Field.Error error={field.error} />
</fieldset>

<style type="postcss">
	.rz-link-field {
		:global(.rz-input) {
			border-bottom-left-radius: 0;
			border-bottom-right-radius: var(--rz-corner-radius);
		}

		:global(:focus-visible),
		:global([data-error]) {
			position: relative;
			z-index: 10;
		}
	}
	.rz-link-field--compact + :global(.rz-field-error) {
		top: -1.3rem;
	}

	
	.rz-link-field__bottom {
		display: flex;
		position: relative;
		border: var(--rz-border);
		border-radius: var(--rz-radius-lg);
		.rz-link__type-text {
			display: none;
		}

		:global(.rz-link__type-single) {
			pointer-events: none;
		}

		:global(.rz-button) {
			min-width: var(--rz-size-20);
			border-top-left-radius: var(--rz-radius-md);
			border-top-right-radius: 0;
			border-bottom-right-radius: 0;
			height: var(--rz-size-11);
			justify-content: start;
			font-size: var(--rz-text-sm);

			> * {
				flex-shrink: 0;
			}

			:global(.rz-link__type-icon) {
				width: var(--rz-size-6);
			}
		}

		@container rz-field-root (min-width:420px) {
			.rz-link__type-text {
				display: block;
			}
			:global(.rz-button) {
				min-width: var(--rz-size-32);
			}
		}

		:global(.rz-input),
		:global(.rz-ressource-input) {
			border-top-left-radius: 0;
			border-bottom-left-radius: 0;
			border-top-right-radius: 0;
			border-top: 0;
			border-bottom: 0;
		}
	}

	.rz-link__target {
		background-color: hsl(var(--rz-ground-5));
		border-bottom-right-radius: var(--rz-radius-md);
		border-top-right-radius: var(--rz-radius-md);
		display: flex;
		align-items: center;
		gap: var(--rz-size-4);
		min-width: 140px;
		padding: 0 var(--rz-size-4);
		@container rz-field-root (max-width:420px) {
			min-width: auto;
			:global(.rz-label) {
				display: none;
			}
		}
	}
</style>
