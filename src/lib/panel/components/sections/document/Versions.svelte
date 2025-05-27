<script lang="ts">
	import { env } from '$env/dynamic/public';
	import type { DocPrototype, GenericDoc, PrototypeSlug } from '$lib/core/types/doc.js';
	import { getLocaleContext } from '$lib/panel/context/locale.svelte.js';
	import { onMount } from 'svelte';
	import PageHeader from '../../ui/page-header/PageHeader.svelte';
	import { t__ } from '../../../../core/i18n/index.js';
	import Button from '../../ui/button/button.svelte';
	import { X } from '@lucide/svelte';

	type Props = { doc: GenericDoc };
	const { doc }: Props = $props();

	const locale = getLocaleContext();
	let versions = $state<GenericDoc[]>([]);

	const url = $derived.by(() => {
		if (doc._prototype === 'collection') {
			return `${env.PUBLIC_RIZOM_URL}/api/${doc._type}_versions?where[ownerId][equals]=${doc.id}&sort=-updatedAt`;
		} else {
			return `${env.PUBLIC_RIZOM_URL}/api/${doc._type}_versions`;
		}
	});

  const backUrl = $derived.by(() => {
		if (doc._prototype === 'collection') {
			return `${env.PUBLIC_RIZOM_URL}/panel/${doc._type}/${doc.id}`;
		} else {
			return `${env.PUBLIC_RIZOM_URL}/panel/${doc._type}`;
		}
	});

	onMount(async () => {
		versions = await fetch(url)
			.then((r) => r.json())
			.then((r) => r.docs);
	});
</script>

<section class="rz-document-versions">
	<PageHeader>
    <div class="rz-document-versions__header">
      <Button href={backUrl} variant="ghost" size="icon-sm">
        <X class="rz-page-header__close" size="17" />
      </Button>
      <h2>{t__('common.versions')}</h2>
    </div>
	</PageHeader>
	<div class="rz-document-versions__list">
		{#each versions as version}
			<a class="rz-document-versions__list-item" class:rz-document-versions__list--active={doc.versionId === version.id} href="{env.PUBLIC_RIZOM_URL}/panel/{doc._type}/{doc.id}/versions?versionId={version.id}">
				{locale.dateFormat(version.updatedAt!, { withTime: true })}
        {version.status}
      </a>
		{/each}
	</div>
</section>

<style lang="postcss">
	.rz-document-versions {
		min-height: 100vh;
		border-left: var(--rz-border);
	}

  .rz-document-versions__list-item{
    height: calc(var(--rz-size-14) - 1px);
    padding: 0 var(--rz-field-padding, var(--rz-size-6));
    display: flex;
    border-bottom: var(--rz-border);
    align-items: center;
  }

  .rz-document-versions__list{
    display: grid;
  }
  .rz-document-versions__list--active{
    text-decoration: underline;
  }

  .rz-document-versions__header{
    display: flex;
    gap: var(--rz-size-2);;
    margin-left: calc(-1 * var(--rz-size-2));
    align-items: center;
  }
  h2{
    @mixin font-bold;
  }
</style>
