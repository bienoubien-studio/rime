<script lang="ts">
	import Button from 'rizom/panel/components/ui/button/button.svelte';
	import { EllipsisVertical, Trash2 } from 'lucide-svelte';
	import * as Popover from '$lib/panel/components/ui/popover';
	import { __t } from 'rizom/panel/i18n';

	type Props = {
		deleteBlock: () => void;
	};

	const { deleteBlock }: Props = $props();

	let open = $state(false);

	const onClick = (e: MouseEvent) => {
		open = !open;
		if (e && e.stopPropagation) e.stopPropagation();
	};
</script>

<button class="rz-block-actions__toggle" type="button" onclick={onClick}>
	<EllipsisVertical size={13} />
</button>

<Popover.Root bind:open>
	<Popover.Trigger />
	<Popover.Portal>
		<Popover.Content class="rz-block-actions__content" align="end">
			<Button
				class="rz-block-actions__delete-button"
				size="sm"
				variant="ghost"
				type="button"
				onclick={deleteBlock}
			>
				<Trash2 size={13} />
				{__t('fields.delete_block')}
			</Button>
		</Popover.Content>
	</Popover.Portal>
</Popover.Root>

<style type="postcss">
	.rz-block-actions__toggle {
		padding: var(--rz-size-3);
	}

	:global(.rz-block-actions__content) {
		width: auto;
		padding: var(--rz-size-1);
	}

	:global(.rz-block-actions__delete-button) {
		display: flex;
		width: 100%;
		align-items: center;
		justify-content: flex-end;
		gap: var(--rz-size-3);
	}
</style>
