<script lang="ts">
	import type { JSONContent } from '@tiptap/core';
	import RenderRichText from './render-rich-text.svelte';
	import type { Snippet, Component } from 'svelte';

	type NodeComp = Component<{ node: JSONContent[number]; children: Snippet }>;
	type Props = {
		json?: JSONContent;
		components?: {
			heading?: NodeComp;
			paragraph?: NodeComp;
			blockquote?: NodeComp;
			bold?: NodeComp;
			italic?: NodeComp;
			link?: NodeComp;
			ul?: NodeComp;
			media?: NodeComp;
			resource?: NodeComp;
			li?: NodeComp;
			ol?: NodeComp;
		} & Record<string, NodeComp>;
	};

	function shiftAndReturn<T>(arr: T[]): [T | undefined, T[]] {
		const arrayClone = [...arr];
		const item = arrayClone.shift(); // removes and returns the first element
		return [item, arrayClone];
	}

	const { json, components }: Props = $props();
</script>

{#snippet renderMarks(node: JSONContent[number])}
	{@const marks = [...(node.marks || [])]}
	{@const [mark, processedMarks] = shiftAndReturn(marks)}
	{@const processedNode = { ...node, marks: processedMarks }}

	{#if marks && marks.length}
		{#if mark.type === 'bold'}
			{#if components?.bold}
				<components.bold {node}>
					{@render renderMarks(processedNode)}
				</components.bold>
			{:else}
				<strong {...mark.attrs}>{@render renderMarks(processedNode)}</strong>
			{/if}
			<!--  -->
		{:else if mark.type === 'italic'}
			{#if components?.italic}
				<components.italic {node}>
					{@render renderMarks(processedNode)}
				</components.italic>
			{:else}
				<em {...mark.attrs}>{@render renderMarks(processedNode)}</em>
			{/if}

			<!--  -->
		{:else if mark.type === 'link'}
			{#if components?.link}
				<components.link {node}>
					{@render renderMarks(processedNode)}
				</components.link>
			{:else}
				<a {...mark.attrs}>{@render renderMarks(processedNode)}</a>
			{/if}
		{/if}
	{:else}
		{node.text}
	{/if}
{/snippet}

{#if json?.content}
	{#each json.content as node, index (index)}
		{#if node.type === 'text'}
			{@render renderMarks(node)}
			<!--  -->
		{:else if node.type === 'paragraph'}
			{#if components?.paragraph}
				<components.paragraph {node}>
					<RenderRichText {components} json={node} />
				</components.paragraph>
			{:else}
				<p {...node.attrs}><RenderRichText {components} json={node} /></p>
			{/if}
			<!--  -->
		{:else if node.type === 'heading'}
			{#if components?.heading}
				<components.heading {node}>
					<RenderRichText {components} json={node} />
				</components.heading>
			{:else}
				{@const tag = `h${node.attrs?.level || 2}`}
				<svelte:element this={tag} {...node.attrs}><RenderRichText {components} json={node} /></svelte:element>
			{/if}
			<!--  -->
		{:else if node.type === 'blockquote'}
			{#if components?.blockquote}
				<components.blockquote {node}>
					<RenderRichText {components} json={node} />
				</components.blockquote>
			{:else}
				<blockquote {...node.attrs}><RenderRichText {components} json={node} /></blockquote>
			{/if}
			<!--  -->
		{:else if node.type === 'bulletList'}
			{#if components?.ul}
				<components.ul {node}>
					<RenderRichText {components} json={node} />
				</components.ul>
			{:else}
				<ul {...node.attrs}><RenderRichText {components} json={node} /></ul>
			{/if}
			<!--  -->
		{:else if node.type === 'orderedList'}
			{#if components?.ol}
				<components.ol {node}>
					<RenderRichText {components} json={node} />
				</components.ol>
			{:else}
				<ol {...node.attrs}><RenderRichText {components} json={node} /></ol>
			{/if}
			<!--  -->
		{:else if node.type === 'listItem'}
			{#if components?.li}
				<components.li {node}>
					<RenderRichText {components} json={node} />
				</components.li>
			{:else}
				<li {...node.attrs}><RenderRichText {components} json={node} /></li>
			{/if}
			<!--  -->
		{:else if node.type === 'media'}
			{#if components?.media}
				<components.media {node}>
					<RenderRichText {components} json={node} />
				</components.media>
			{:else}
				[Provide a media component with a node prop to render this node]
			{/if}
			<!--  -->
		{:else if node.type === 'resource'}
			{#if components?.resource}
				<components.resource {node}>
					<RenderRichText {components} json={node} />
				</components.resource>
			{:else}
				[Provide a resource component with a node prop to render this node]
			{/if}
			<!--  -->
		{:else if components && node.type && node.type in components}
			{@const CustomNode = components[node.type]}
			<CustomNode {node}>
				<RenderRichText {components} json={node} />
			</CustomNode>
		{:else if node.content}
			<RenderRichText {components} json={node} />
		{/if}
	{/each}
{/if}
