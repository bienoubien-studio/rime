<script lang="ts">
	import type { DocumentFormContext } from '$lib/panel/context/documentForm.svelte';
	import Button from '../../ui/button/button.svelte';
	import * as Dialog from '$lib/panel/components/ui/dialog/index.js';
	import StatusDot from '../collection/StatusDot.svelte';
	import * as Radio from '$lib/panel/components/ui/radio-group/index.js';
	import { PARAMS, VERSIONS_STATUS, type VersionsStatus } from '$lib/core/constant.js';
	import { t__ } from '../../../../core/i18n/index.js';
	import Label from '../../ui/label/label.svelte';
	import { env } from '$env/dynamic/public';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';
	type Props = { form: DocumentFormContext };
	const { form }: Props = $props();

	const statusList = Object.values(VERSIONS_STATUS);

	let dialogOpen = $state(false);

	async function handleValidateStatus() {
		const urlId = form.doc._prototype === 'collection' ? `/${form.doc.id}` : '/';
		await fetch(
			`${env.PUBLIC_RIZOM_URL}/api/${form.doc._type}${urlId}?draft=true&${PARAMS.VERSION_ID}=${form.doc.versionId}`,
			{
				method: 'PATCH',
				body: JSON.stringify({
					status: internalValue
				})
			}
		)
			.then((r) => {
				if (r.status === 200) {
					toast.success(t__('common.doc_updated'));
					form.setValue('status', internalValue);
					dialogOpen = false;
					invalidateAll();
				} else {
					toast.error(t__('error.generic'));
				}
			})
			.catch((err) => {
				toast.error(t__('error.generic'));
			});
	}

	let initialValue = $state.snapshot(form.doc.status);
	let internalValue = $state(initialValue);
</script>

<Dialog.Root bind:open={dialogOpen}>
	<Dialog.Trigger>
		{#snippet child(props)}
			<Button size="sm" variant="secondary" onclick={() => (dialogOpen = true)} {...props}>
				<StatusDot status={form.doc.status} />
				<p class="rz-status__text">{t__(`common.${form.doc.status}`)}</p>
			</Button>
		{/snippet}
	</Dialog.Trigger>
	<Dialog.Content class="rz-status-dialog">
		<Radio.Root bind:value={internalValue}>
			{#each statusList as status, index (index)}
				<div class="rz-radio__option">
					<Radio.Item id="document.{status}" value={status} />
					<Label for="document.{status}">
						{t__(`common.${status}`)}<br />
						<p>{t__(`common.${status}_infos`)}</p>
					</Label>
				</div>
			{/each}
		</Radio.Root>
		<Dialog.Footer --rz-justify-content="space-between">
			<Button onclick={handleValidateStatus} variant="outline">Validate</Button>
			<Button onclick={() => (dialogOpen = false)} variant="secondary">Cancel</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<style lang="postcss">
	.rz-radio__option {
		display: flex;
		gap: var(--rz-size-3);
		padding: var(--rz-size-3);
		border: var(--rz-border);
	}
	:global {
		.rz-dialog-footer button {
			flex: 1;
		}
	}
	p {
		color: hsl(var(--rz-color-fg) / 0.5);
		@mixin font-normal;
	}
</style>
