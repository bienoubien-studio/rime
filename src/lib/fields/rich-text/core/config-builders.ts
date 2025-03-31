import type { EditorOptions } from "@tiptap/core";
import Placeholder from "@tiptap/extension-placeholder";
import type { RichTextField } from "rizom/fields/rich-text";
import { t__ } from "rizom/panel/i18n";
import Typography from '@tiptap/extension-typography';
import type { RichTextEditorConfig, RichTextFeature } from "rizom/fields/rich-text/core/types";
import { defaultFeatures, predefinedFeatures } from "./features";
import ListItem from '@tiptap/extension-list-item'
import Dropcursor from '@tiptap/extension-dropcursor'
import Document from "@tiptap/extension-document";
import Gapcursor from '@tiptap/extension-gapcursor'
import Text from "@tiptap/extension-text";
import History from "@tiptap/extension-history";
import Paragraph from "@tiptap/extension-paragraph";
import { ParagraphFeature } from "./features/paragraph";
import { MediaFeature } from "./features/media";
import type { Level } from "@tiptap/extension-heading";

export type BuildRichTextEditorConfig = (args: {
  config: RichTextField;
  element: HTMLElement;
}) => RichTextEditorConfig;

/**
 * Builds a rich text editor configuration based on the provided features
 */
export function buildEditorConfig(incommingFeatures: (RichTextFeature | string)[] = []): RichTextEditorConfig {
  let features: RichTextFeature[] = []
  
  // If no features are provided, use default features
  if (incommingFeatures.length === 0) {
    features = defaultFeatures;
  }else{
    // Build feature list
    incommingFeatures.forEach(config => {
      // Convert predefined feature name to feature
			if (typeof config === 'string') {
          // Look up predefined feature by name
          if( config in predefinedFeatures ){
            const featureName = config as keyof typeof predefinedFeatures;
            const feature = predefinedFeatures[featureName]
            // handle heading defaults
            if( featureName === 'heading' && typeof feature === 'function'){
              features.push(feature(2,3,4))
            }else if ('extension' in feature) {
              features.push(feature)
            }
          } else if(config.includes(':')){
            const parts = config.split(':')
            const featureName = parts[0]
            if( featureName === 'heading'){
              const levelsString = parts[1]
              if(levelsString){
                const levels = levelsString.split(',').map( s => parseInt(s)) as Level[]
                features.push(predefinedFeatures.heading(...levels))
              } 
            } else if( featureName === 'media' ){
              const query = parts[1]
              const mediaFeature = MediaFeature({ query })
              features.push(mediaFeature)
            } else {
              throw new Error(`Unrecognized ${featureName} feature, only 'media' and 'heading' support the {name}:{config} notation`)
            }
          }
			} else {
				// Add feature
				features.push(config);
			}
		});
  }

  // Add mandatory paragraph feature if not provided
  const hasParagraph = features.some(feature => feature.extension.name === 'paragraph')
  if(!hasParagraph){
    features.push(ParagraphFeature);
  }

  // Create base editor configuration with essential extensions
  const baseEditorConfig: Partial<EditorOptions> = {
    extensions: [
      Document,
      Text,
      History,
      Dropcursor,
      Gapcursor,
      Placeholder.configure({
        emptyEditorClass: 'empty-editor',
        placeholder: t__('fields.write_something') + ' / press ⌘ + K'
      })
    ],
  };
  
  // Add list item extension if bulletList or orderedList provided
  const hasList = features.some(feature => ['orderedList', 'bulletList'].includes(feature.extension.name))
  if(hasList){
    baseEditorConfig.extensions?.push(ListItem);
  }

  // Add all feature extensions to the editor
  // We need to track which extensions we've already added to avoid duplicates
  const addedExtensions = new Set();
  
  features.forEach(feature => {
    if (feature.extension && !addedExtensions.has(feature.extension)) {
      baseEditorConfig.extensions?.push(feature.extension);
      addedExtensions.add(feature.extension);
    }
  });
  
  if(baseEditorConfig.extensions?.find(ext => ext.name === 'typography')){
    baseEditorConfig.extensions.push(Typography)
  }
  
  return {
    tiptap: baseEditorConfig,
    features: features
  };
}

/**
 * Default configuration builder that provides a basic set of features
 */
export function buildDefaultConfig(): RichTextEditorConfig {
  return buildEditorConfig(defaultFeatures);
}
