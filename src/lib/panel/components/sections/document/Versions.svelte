<script lang="ts">
	import { env } from '$env/dynamic/public';
	import type { GenericDoc, VersionDoc } from '$lib/core/types/doc.js';
	import { getLocaleContext } from '$lib/panel/context/locale.svelte.js';
	import { t__ } from '../../../../core/i18n/index.js';
	import Button from '../../ui/button/button.svelte';
	import { X } from '@lucide/svelte';
	import ScrollArea from '../../ui/scroll-area/scroll-area.svelte';
	import StatusDot from '../collection/StatusDot.svelte';

	type Props = {
		doc: GenericDoc;
		versions: VersionDoc[];
	};
	const { doc, versions }: Props = $props();

	const locale = getLocaleContext();

	const makeVersionUrl = (version: VersionDoc) => {
		if (doc._prototype === 'collection') {
			return `${env.PUBLIC_RIZOM_URL}/panel/${doc._type}/${doc.id}/versions?versionId=${version.id}`;
		} else {
			return `${env.PUBLIC_RIZOM_URL}/panel/${doc._type}/versions?versionId=${version.id}`;
		}
	};

	const returnUrl = $derived.by(() => {
		if (doc._prototype === 'collection') {
			return `${env.PUBLIC_RIZOM_URL}/panel/${doc._type}/${doc.id}?versionId=${doc.versionId}`;
		} else {
			return `${env.PUBLIC_RIZOM_URL}/panel/${doc._type}?versionId=${doc.versionId}`;
		}
	});
</script>

<section class="rz-document-versions">
	<ScrollArea>
		<div class="rz-document-versions__header">
			<Button href={returnUrl} size="icon-sm" variant="ghost" icon={X}></Button>
			<h2>{t__('common.versions_history')}</h2>
		</div>

		<div class="rz-document-versions__list">
			{#each versions as version}
				<a
					class="rz-document-versions__list-item"
					class:rz-document-versions__list--active={doc.versionId === version.id}
					href={makeVersionUrl(version)}
				>
					<span>{locale.dateFormat(version.updatedAt!, { short: true, withTime: true })}</span>
					<StatusDot --rz-dot-size="0.5rem" status={version.status} />
				</a>
			{/each}
		</div>
	</ScrollArea>
</section>

<style lang="postcss">
	.rz-document-versions {
		position: sticky;
		top: 0;
		height: 100vh;
		border-left: var(--rz-border);

		.rz-document-versions__list {
			padding: var(--rz-size-5);
			margin-top: var(--rz-size-4);
			display: grid;
			gap: var(--rz-size-2);
		}
		:global(.rz-scroll-area) {
			height: 100vh;
		}
	}

	.rz-document-versions__list-item {
		height: calc(var(--rz-input-height));
		padding: 0 var(--rz-size-6);
		display: flex;
		border-radius: var(--rz-radius-lg);
		align-items: center;
		background-color: hsl(var(--rz-gray-10));
		justify-content: space-between;
	}

	.rz-document-versions__list--active {
		text-decoration: underline;
	}

	.rz-document-versions__header {
		display: flex;
		gap: var(--rz-size-2);
		padding: var(--rz-size-5) var(--rz-size-5) 0 var(--rz-size-5);
		margin-left: calc(-1 * var(--rz-size-2));
		align-items: center;
		/* justify-content: space-between; */
	}
	h2 {
		@mixin font-bold;
	}
</style>
