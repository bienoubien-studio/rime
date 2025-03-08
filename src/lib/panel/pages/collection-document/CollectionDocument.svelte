<script lang="ts">
	import { goto } from '$app/navigation';
	import Collection from 'rizom/panel/components/sections/collection/Collection.svelte';
	import type { GenericDoc, PrototypeSlug } from 'rizom/types/doc';
	import Unauthorized from 'rizom/panel/components/sections/unauthorized/Unauthorized.svelte';
	import Document from 'rizom/panel/components/sections/document/Document.svelte';

	type Props = {
		slug: PrototypeSlug;
		data: {
			docs: GenericDoc[];
			doc: GenericDoc;
			status: number;
			readOnly: boolean;
			operation: 'create' | 'update';
		};
	};

	const { data, slug }: Props = $props();
</script>

{#if data.status === 200}
	<div class="rz-collection-container">
		<div class="rz-collection-container__list">
			<Collection compact={true} {slug} />
		</div>

		<Document
			class="rz-collection-container__doc"
			doc={data.doc}
			onClose={() => goto(`/panel/${slug}`)}
			operation={data.operation}
			readOnly={data.readOnly}
		/>
	</div>
{:else}
	<Unauthorized />
{/if}

<style type="postss">
	.rz-collection-container {
		container-name: rz-collection-container;
		container-type: inline-size;
		display: grid;
		grid-template-columns: repeat(12, minmax(0, 1fr));
		& :global(.rz-document) {
			grid-column: span 12 / span 12;
			min-height: 100vh;
		}
	}

	.rz-collection-container__list {
		top: var(--rz-size-4);
		display: none;
	}

	/* @container rz-collection-container (min-width: 62rem) {
		.rz-collection-container__list {
			display: block;
			grid-column: span 4 / span 4;
		}

		.rz-collection-container :global(.rz-document) {
			border-left: var(--rz-border);
			grid-column: span 8 / span 8;
		}
	} */

	@container rz-collection-container (min-width: 72rem) {
		.rz-collection-container__list {
			display: block;
			grid-column: span 3 / span 3;
		}

		.rz-collection-container :global(.rz-document) {
			border-left: var(--rz-border);
			grid-column: span 9 / span 9;
		}
	}
</style>
