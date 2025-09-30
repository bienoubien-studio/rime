import { t__ } from '$lib/core/i18n/index.js';
import type { RichTextEditorConfig, RichTextFeature } from '$lib/fields/rich-text/core/types';
import type { EditorOptions } from '@tiptap/core';
import Document from '@tiptap/extension-document';
import HardBreak from '@tiptap/extension-hard-break';
import { ListItem } from '@tiptap/extension-list';
import Text from '@tiptap/extension-text';
import Typography from '@tiptap/extension-typography';
import { Dropcursor, Gapcursor, Placeholder, UndoRedo } from '@tiptap/extensions';
import { hasSuggestion } from '../util.js';
import { CurrentNodeAttribute } from './extensions/current-node/current-node.js';
import { defaultFeatures } from './features/index.js';
import { ParagraphFeature } from './features/paragraph.js';

type BuildEditorConfigArgs = {
	features?: Array<RichTextFeature>;
	standAlone?: boolean;
};

/**
 * Builds a rich text editor configuration based on the provided features
 */
export function buildEditorConfig(args: BuildEditorConfigArgs): RichTextEditorConfig {
	const { features: incommingFeatures = [] } = args;

	const features: RichTextFeature[] = incommingFeatures.length === 0 ? defaultFeatures : incommingFeatures;

	const withSuggestion = hasSuggestion(features);

	// Add mandatory paragraph feature if not provided
	const hasParagraph = features
		.filter((feature) => !!feature.extension)
		.some((feature) => feature.extension!.name === 'paragraph');
	if (!hasParagraph) {
		features.push(ParagraphFeature);
	}

	// Create base editor configuration with essential extensions
	const baseEditorConfig: Partial<EditorOptions> = {
		extensions: [
			Document,
			Text,
			UndoRedo,
			Dropcursor,
			HardBreak,
			Gapcursor,
			CurrentNodeAttribute,
			Typography,
			Placeholder.configure({
				emptyEditorClass: 'empty-editor',
				placeholder: t__('fields.write_something') + (withSuggestion ? ' / ⌘ + K' : '')
			})
		]
	};

	// Add list item extension if bulletList or orderedList provided
	const hasList = features
		.filter((feature) => !!feature.extension)
		.some((feature) => ['orderedList', 'bulletList'].includes(feature.extension!.name));
	if (hasList) {
		baseEditorConfig.extensions?.push(ListItem);
	}

	// Add all feature extensions to the editor
	// We need to track which extensions we've already added to avoid duplicates
	const addedExtensions = new Set();

	features.forEach((feature) => {
		if (feature.extension && !addedExtensions.has(feature.extension)) {
			baseEditorConfig.extensions?.push(feature.extension);
			addedExtensions.add(feature.extension);
		}
	});


	return {
		tiptap: baseEditorConfig,
		features: features
	};
}
