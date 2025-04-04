import { generateHTML as tiptapGenerateHTML } from '@tiptap/html';
import type { EditorOptions, JSONContent } from "@tiptap/core";
import type { MediaFeatureDefinition, PredefinedFeatureName, ResourceFeatureDefinition, RichTextEditorConfig, RichTextFeature } from "rizom/fields/rich-text/core/types";
import { defaultFeatures, predefinedFeatures } from "./features";
import ListItem from '@tiptap/extension-list-item'
import Document from "@tiptap/extension-document";
import Text from "@tiptap/extension-text";
import { ParagraphFeature } from "./features/paragraph";
import { MediaFeature } from "./features/media";
import type { Level } from "@tiptap/extension-heading";
import { ResourceFeature } from "./features/resource";

/**
 * Builds a rich text editor configuration based on the provided features
 */
export function buildGenerateHTML(
  incommingFeatures : Array<ResourceFeatureDefinition | MediaFeatureDefinition | PredefinedFeatureName | RichTextFeature> = []
) {
  
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
            } else if( featureName === 'resource' ){
              const query = parts[1]
              const collectionSlug = parts[1].split('?')[0]
              const resourceFeature = ResourceFeature({ query, slug: collectionSlug })
              features.push(resourceFeature)
            } else {
              throw new Error(`Unrecognized ${featureName} feature, only 'media', 'resource' and 'heading' support the {name}:{config} notation`)
            }
          }
      } else {
        features.push(config);
      }
    });
  }

  // Add mandatory paragraph feature if not provided
  const hasParagraph = features.filter(feature => !!feature.extension).some(feature => feature.extension!.name === 'paragraph')
  if(!hasParagraph){
    features.push(ParagraphFeature);
  }

  // Create base editor configuration with essential extensions
  const extensions: Partial<EditorOptions>['extensions'] = [
      Document,
      Text
    ]
  
  
  // Add list item extension if bulletList or orderedList provided
  const hasList = features.filter(feature => !!feature.extension ).some(feature => ['orderedList', 'bulletList'].includes(feature.extension!.name))
  if(hasList){
    extensions?.push(ListItem);
  }

  // Add all feature extensions to the editor
  // We need to track which extensions we've already added to avoid duplicates
  const addedExtensions = new Set();
  
  features.forEach(feature => {
    if (feature.extension && !addedExtensions.has(feature.extension)) {
      extensions?.push(feature.extension);
      addedExtensions.add(feature.extension);
    }
  });
  
  const generateHTML = (value?: JSONContent) => {
    if (!value) return '';
    return tiptapGenerateHTML(value, extensions);
  };

  return generateHTML
}
