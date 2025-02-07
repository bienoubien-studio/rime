import { type EditorOptions } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { RichTextLink } from './extensions/Link';
import type { RichTextField } from '..';
import { t__ } from 'rizom/panel/i18n';

type BuildEditorConfig = (args: {
	config: RichTextField;
	element: HTMLElement;
	editable: boolean;
	setValue: (value: any) => void;
	onFocus?: any;
}) => Partial<EditorOptions>;

export const buildEditorConfig: BuildEditorConfig = ({
	config,
	element,
	editable,
	setValue,
	onFocus
}) => {
	const editorConfig: Partial<EditorOptions> = {
		element,
		editable,
		extensions: [
			StarterKit.configure({
				hardBreak: {
					//@ts-expect-error Idunowhy
					addKeyboardShortcuts() {
						return {
							//@ts-expect-error Idunowhy
							Enter: () => this.editor.commands.setHardBreak()
						};
					}
				}
			}),
			Placeholder.configure({
				emptyEditorClass: 'empty-editor',
				placeholder: t__('fields.write_something')
			})
		],
		onUpdate: (props) => setValue(props.editor.getJSON())
	};

	if (config.nodes.includes('a')) {
		const linkExtension = RichTextLink;
		editorConfig.extensions?.push(linkExtension);
	}

	if (onFocus) {
		editorConfig.onFocus = onFocus;
	}

	return editorConfig;
};
