import { BoldFeature } from './bold.js';
import { BulletListFeature } from './bullet-list.js';
import { HeadingFeature } from './heading.js';
import { HorizontalRuleFeature } from './hr.js';
import { LinkFeature } from './link/index.js';
import { ParagraphFeature } from './paragraph.js';
import { OrderedListFeature } from './ordered-list.js';
import { BlockquoteFeature } from './blockquote.js';
import { ItalicFeature } from './italic.js';

export { BoldFeature, HeadingFeature, LinkFeature, HorizontalRuleFeature };

export const predefinedFeatures = {
	blockquote: BlockquoteFeature,
	bold: BoldFeature,
	italic: ItalicFeature,
	ul: BulletListFeature,
	heading: HeadingFeature,
	hr: HorizontalRuleFeature,
	ol: OrderedListFeature,
	link: LinkFeature
};

export const defaultFeatures = [
	ParagraphFeature,
	HeadingFeature(2, 3, 4),
	BoldFeature,
	LinkFeature,
	HorizontalRuleFeature,
	BulletListFeature,
	OrderedListFeature,
	BlockquoteFeature
];
