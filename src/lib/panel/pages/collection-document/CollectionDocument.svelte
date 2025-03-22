<script lang="ts">
	import { goto } from '$app/navigation';
	import Collection from 'rizom/panel/components/sections/collection/Collection.svelte';
	import type { GenericDoc, PrototypeSlug } from 'rizom/types/doc';
	import Unauthorized from 'rizom/panel/components/sections/unauthorized/Unauthorized.svelte';
	import Document from 'rizom/panel/components/sections/document/Document.svelte';
	import { PaneGroup, Pane, PaneResizer } from 'rizom/panel/components/ui/pane/index.js';
	import { setAPIProxyContext } from 'rizom/panel/context/api-proxy.svelte';

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
	
	setAPIProxyContext('document');

</script>

{#if data.status === 200}
	<PaneGroup class="rz-collection-container" autoSaveId="rz-collection-document:panel-state" direction="horizontal">
		<Pane defaultSize={40}>
			<div class="rz-collection-container__list">
				<Collection compact={true} {slug} />
			</div>
			
		</Pane>
		<PaneResizer />
		<Pane>
			<Document
				class="rz-collection-container__doc"
				doc={data.doc}
				onClose={() => goto(`/panel/${slug}`)}
				operation={data.operation}
				readOnly={data.readOnly}
			/>
		</Pane>
	</PaneGroup>
{:else}
	<Unauthorized />
{/if}

<style lang="postcss">
	:global(.rz-collection-container) {
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
	}

	:global(.rz-collection-container) :global(.rz-document) {
		border-left: var(--rz-border);
		grid-column: span 9 / span 9;
	}
	
	@container rz-collection-container (min-width: 72rem) {
		.rz-collection-container__list {
			grid-column: span 3 / span 3;
		}

	}
</style>
