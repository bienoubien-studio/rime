import { BoldFeature } from './bold';
import { BulletListFeature } from './bullet-list';
import { HeadingFeature } from './heading';
import { HorizontalRuleFeature } from './hr';
import { LinkFeature } from './link';
import { ParagraphFeature } from './paragraph';
import { OrderedListFeature } from './ordered-list';
import { BlockquoteFeature } from './blockquote';
import { ItalicFeature } from './italic';

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
