<script lang='ts'>
	import type { CollectionContext } from "$lib/panel/context/collection.svelte.js";
	import { t__ } from "../../../../core/i18n/index.js";

  type Props = { collection: CollectionContext }
  const { collection }: Props = $props()
</script>

<div class="rz-page-collection__empty">
  <div>
    <span>
      {t__(`common.no_document|${collection.config.label.gender}`, collection.config.label.singular)}
    </span>
  </div>
</div>

<style lang="postcss">
  
	.rz-page-collection__empty {
		height: var(--rz-input-height);
		background-color: hsl(var(--rz-ground-4));
		display: flex;
		align-items: center;
		border-radius: var(--rz-radius-md);
		padding: var(--rz-size-3);
		border: var(--rz-border);
	}
</style>