import type { EditorOptions } from "@tiptap/core";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit, { type StarterKitOptions } from "@tiptap/starter-kit";
import type { RichTextField } from "rizom/fields/rich-text";
import { t__ } from "rizom/panel/i18n";
import Highlight from '@tiptap/extension-highlight'
import Typography from '@tiptap/extension-typography'
import Link from "@tiptap/extension-link";
import type { RichTextEditorConfig } from "rizom/fields/rich-text/core/types";
import LinkSelector from "rizom/fields/rich-text/component/bubble-menu/link-selector/link-selector.svelte";
import { defaultMarks } from "./marks";
import { defaultNodes } from "./nodes";
import { parseShortcutConfig } from "./parser";

// Idea on a shortcut config string :
// '[ p | h1 | h2 | quote ] b | s | u | a' 

type SetEditorConfig = (args: {
	config: RichTextField;
	element: HTMLElement;
}) => RichTextEditorConfig;


export const buildDefaultConfig: SetEditorConfig = () => 
  buildConfigFromString('[ p | h2 | h3 | h4 ] b | h | a')


type SetEditorConfigFromString = (shortcut:string) => RichTextEditorConfig

export const buildConfigFromString: SetEditorConfigFromString = (shortcut:string) => {
  
  const { marks: stringMarks,  nodes: stringNodes, hasAnchor } = parseShortcutConfig(shortcut)

  const shortcutMarks = defaultMarks.filter(mark => stringMarks.includes(mark.name))
  const shortcutNodes = defaultNodes.filter(node => stringNodes.includes(node.name))
  // marks
  const hasBold = shortcutMarks.find(mark => mark.name === 'b')
  const hasCode = shortcutMarks.find(mark => mark.name === 'code')
  const hasItalic = shortcutMarks.find(mark => mark.name === 'i')
  const hasStrike = shortcutMarks.find(mark => mark.name === 's')
  // nodes
  const hasQuote = shortcutNodes.find(node => node.name === 'quote')
  const hasCodeBlock = shortcutNodes.find(node => node.name === 'codeBlock')
  const hasHR = shortcutNodes.find(node => node.name === 'hr')
  const hasBullet = shortcutNodes.find(node => node.name === 'li')
  const hasOrdered = shortcutNodes.find(node => node.name === 'ol')
  
  const headingNodes = shortcutNodes.filter(node => {
    const isHeading = /^h[1-6]$/.test(node.name);
    return isHeading;
  });
  const hasHeading = headingNodes.length > 0;
    
  const starterKitConfig:Partial<StarterKitOptions> = {
    hardBreak: {
      //@ts-expect-error Idunowhy
      addKeyboardShortcuts() {
        return {
          //@ts-expect-error Idunowhy
          Enter: () => this.editor.commands.setHardBreak()
        };
      }
    }
  }

  if(!hasBold) starterKitConfig.bold = false
  if(!hasItalic) starterKitConfig.italic = false
  if(!hasCode) starterKitConfig.code = false
  if(!hasStrike) starterKitConfig.strike = false
  if(!hasQuote) starterKitConfig.blockquote = false
  if(!hasCodeBlock) starterKitConfig.codeBlock = false
  if(!hasHR) starterKitConfig.horizontalRule = false
  if(!hasBullet) starterKitConfig.bulletList = false
  if(!hasOrdered) starterKitConfig.orderedList = false
  if(!hasBullet && !hasOrdered) starterKitConfig.listItem = false
  
  if(!hasHeading) {
    starterKitConfig.heading = false
  } else {
    // Extract levels and ensure they are valid (1-6)
    const levels = headingNodes
      .map(node => parseInt(node.name.replace('h', ''), 10))
      .filter(level => !isNaN(level) && level >= 1 && level <= 6) as (1|2|3|4|5|6)[];
    
    if (levels.length > 0) {
      starterKitConfig.heading = {
        levels
      };
    }
  }

  const baseEditorConfig: Partial<EditorOptions> = {
		extensions: [
			StarterKit.configure({
        ...starterKitConfig,
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
			}),
			Highlight,
			Typography,
		],
	};
  
  const output: RichTextEditorConfig = {
    tiptap: baseEditorConfig,
		marks: shortcutMarks,
		nodes: shortcutNodes
  }

  if(hasAnchor){
    output.tiptap.extensions?.push(
      Link.extend({ inclusive: false }).configure({
				openOnClick: false,
				HTMLAttributes: {
					class: 'rz-rich-text-link'
				}
			})
    )
    output.bubbleMenu = { components : [ LinkSelector ] }
  }

	return output
}
