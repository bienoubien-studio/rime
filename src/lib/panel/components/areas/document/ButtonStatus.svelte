<script lang="ts">
	import type { DocumentFormContext } from 'rizom/panel/context/documentForm.svelte';
	import * as Popover from '$lib/panel/components/ui/popover/index.js';
	import Button from '../../ui/button/button.svelte';
	import StatusDot from '../collection/StatusDot.svelte';

	type Props = { form: DocumentFormContext };
	const { form }: Props = $props();

	if (!(form.config.type === 'collection')) throw new Error('Expected collection config');
	if (!form.config.status) throw new Error('Unexpected empty satus');

	const status = ['draft', 'published'];
	const isDraft = $derived(form.doc.status === status[0]);
</script>

<button
	type="button"
	class="rz-status"
	aria-label="change status"
	onclick={() => {
		form.setValue('status', isDraft ? status[1] : status[0]);
		form.element?.requestSubmit();
	}}
>
	<StatusDot status={form.doc.status} />
	<p class="rz-status__text">{status[Number(!isDraft)]}</p>
</button>

<style lang="postcss">
	.rz-status {
		--x: 0;
		--opacity: 0;
		display: flex;
		min-width: 0.8rem;
		gap: var(--rz-size-4);
		flex: var(--x);
		text-transform: uppercase;
		font-size: var(--rz-text-xs);
		letter-spacing: 0.2em;
		align-items: center;
		overflow: hidden;
		transition: flex 1s cubic-bezier(0.19, 1, 0.22, 1);
	}
	.rz-status:hover {
		--x: 1;
		--opacity: 0.5;
	}

	.rz-status__text {
		opacity: var(--opacity);
		transition: all 0.5s ease-in-out;
		@mixin font-light /* background-color: red; */;
	}
</style>
