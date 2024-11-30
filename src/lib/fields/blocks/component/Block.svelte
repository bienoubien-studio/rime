<script lang="ts">
	import { GripVertical, ToyBrick } from 'lucide-svelte';
	import BlockActions from './BlockActions.svelte';
	import { capitalize } from '$lib/utils/string.js';
	import { type DocumentFormContext } from '$lib/panel/context/documentForm.svelte';
	import ToggleBlockButton from './ToggleBlockButton.svelte';
	import { useOnce } from '$lib/panel/utility/Once.svelte';
	import RenderFields from 'rizom/panel/components/fields/RenderFields.svelte';
	import type { BlocksFieldBlock } from '../index.ts';

	type Props = {
		config: BlocksFieldBlock;
		path: string;
		sorting: boolean;
		deleteBlock: () => void;
		form: DocumentFormContext;
	};

	const { config, path, deleteBlock, form, sorting = false }: Props = $props();

	let currentPath = $state.raw(path);
	let isOpen = $state(true);
	const position = $derived(parseInt(currentPath.split('.').pop() || '0'));
	const blockValue = $derived(form.useValue(path));

	const { once } = useOnce();

	once(() => {
		isOpen = (localStorage.getItem(`${renderBlockTitle()}:open`) || 'true') === 'true';
	});

	const toggleBlock = (e: MouseEvent) => {
		if (e && e.stopPropagation) {
			e.stopPropagation();
		}
		isOpen = !isOpen;
		localStorage.setItem(`${renderBlockTitle()}:open`, isOpen.toString());
	};

	const renderBlockTitle = () => {
		if (config.renderTitle) {
			const title = config.renderTitle({ fields: blockValue, position });
			if (title) return title;
		}
		const title = config.label ? config.label : capitalize(config.name);
		return `${title} ${position}`;
	};

	$effect(() => {
		if (currentPath !== path) {
			let pathArr = path.split('.');
			form.setValue(`${path}.path`, pathArr.toSpliced(pathArr.length - 1, 1).join('.'));
			currentPath = path;
		}
	});

	const BlockIcon = config.icon || ToyBrick;
</script>

<div data-sorting={sorting} class="rz-block">
	<div class="rz-block__grip">
		<GripVertical size={15} />
	</div>

	<div class="rz-block__content">
		<header class="rz-block__header" class:rz-block__header--closed={!isOpen}>
			<button type="button" onclick={toggleBlock} class="rz-block__title-button">
				<div class="rz-block__title">
					<div class="rz-block__icon">
						<BlockIcon size={12} />
					</div>
					<h3 class="rz-block__heading">
						{renderBlockTitle()}
					</h3>
				</div>
			</button>
			<div class="rz-block__actions">
				<ToggleBlockButton toggle={toggleBlock} {isOpen} />
				<BlockActions {deleteBlock} />
			</div>
		</header>

		<div class="rz-block__fields" class:rz-block__fields--hidden={!isOpen}>
			<RenderFields fields={config.fields} {path} {form} />
		</div>
	</div>
</div>

<style type="postcss">
	.rz-block {
		position: relative;
		margin-left: calc(-1 * var(--rz-size-8));
		padding-left: var(--rz-size-8);
	}

	.rz-block__grip {
		position: absolute;
		left: 0;
		top: var(--rz-size-0-5);
		cursor: grab;
		padding: var(--rz-size-1);
		opacity: 0;
		transition: opacity 0.2s;
	}

	.rz-block:hover .rz-block__grip {
		opacity: 1;
	}

	.rz-block__content {
		background-color: hsl(var(--rz-ground-6));
		border-bottom: var(--rz-border);
	}

	.rz-block__header {
		background-color: hsl(var(--rz-ground-5));
		display: flex;
		height: var(--rz-size-8);
		width: 100%;
		align-items: center;
		justify-content: space-between;
		border-bottom: var(--rz-border);
		padding-left: var(--rz-size-2);
		padding-right: var(--rz-size-2);
	}

	.rz-block__header--closed {
		border-color: transparent;
	}

	.rz-block__title-button {
		display: flex;
		flex: 1;
		align-items: center;
		padding: var(--rz-size-1);
	}

	.rz-block__title {
		display: flex;
		height: var(--rz-size-6);
		align-items: center;
		justify-content: center;
		gap: var(--rz-size-2);
		padding: var(--rz-size-1);
		font-size: var(--rz-text-xs);
	}

	.rz-block__heading {
		@mixin font-medium;
	}

	.rz-block__fields {
		padding: var(--rz-size-8) var(--rz-size-7);
	}

	.rz-block__fields--hidden {
		display: none;
	}

	.rz-block[data-sorting='true'] .rz-block__grip {
		display: none;
	}
</style>
