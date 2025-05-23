<script lang="ts">
	import type { DocumentFormContext } from '$lib/panel/context/documentForm.svelte';
	import Button from '../../ui/button/button.svelte';
	import * as Dialog from '$lib/panel/components/ui/dialog/index.js';
	import StatusDot from '../collection/StatusDot.svelte';
	import type { MouseEventHandler } from 'svelte/elements';

	type Status = { value: string; color: string };
	type Props = { form: DocumentFormContext; statusList: Status[] };
	const { form, statusList }: Props = $props();

	if (!(form.config.type === 'collection')) throw new Error('Expected collection config');
	if (!form.config.status) throw new Error('Unexpected empty satus');

	let dialogOpen = $state(false);
	// const statusList = config;

	let currentStatus = $derived(
		statusList.find((status) => status.value === form.doc.status) || statusList[0]
	);
</script>

{#snippet button(status: Status, onclick: MouseEventHandler<HTMLButtonElement>)}
	<button type="button" class="rz-status" {onclick}>
		<StatusDot color={status.color} />
		<p class="rz-status__text">{status.value}</p>
	</button>
{/snippet}

{#if statusList.length <= 2}
	{@render button(currentStatus, () =>
		form.setValue(
			'status',
			statusList.filter((status) => status.value !== form.doc.status)[0].value
		)
	)}
{:else}
	{@render button(currentStatus, () => (dialogOpen = true))}
	<Dialog.Root bind:open={dialogOpen}>
		<Dialog.Content class="rz-status-dialog">
			<Dialog.Header>
				<Dialog.Title></Dialog.Title>
			</Dialog.Header>
			<div class="rz-status-dialog__list">
				{#each statusList as status, index (index)}
					<Button
						size="lg"
						variant="outline"
						onclick={() => {
							form.doc.status = status.value;
							dialogOpen = false;
						}}
					>
						<StatusDot color={status.color} />
						{status.value}
					</Button>
				{/each}
			</div>
		</Dialog.Content>
	</Dialog.Root>
{/if}

<style lang="postcss">
	.rz-status {
		--x: 0;
		--opacity: 0;
		transition: opacity 1s cubic-bezier(0.19, 1, 0.22, 1);
		flex: var(--x);
		position: relative;
		align-items: center;
		display: flex;
		min-width: 0.8rem;
		gap: var(--rz-size-2);
		text-transform: uppercase;
		overflow: hidden;
		font-size: var(--rz-text-xs);
		letter-spacing: 0.2em;
	}

	.rz-status:hover {
		--x: 1;
		--opacity: 1;
	}

	.rz-status__text {
		opacity: var(--opacity);
		transition: opacity 0.2s ease-in-out;
		@mixin font-light;
	}

	:global(.rz-status-dialog) {
		gap: 0;
		:global(.rz-button:not(:first-child)) {
			border-top: none;
		}
		:global(.rz-button:not(:first-child)),
		:global(.rz-button:not(:last-child)) {
			border-radius: 0;
		}
		:global(.rz-button:first-child) {
			border-bottom-left-radius: 0;
			border-bottom-right-radius: 0;
		}
		:global(.rz-button:last-child) {
			border-top-left-radius: 0;
			border-top-right-radius: 0;
		}
	}

	.rz-status-dialog__list {
		display: grid;
		margin-top: 1rem;
	}
</style>
