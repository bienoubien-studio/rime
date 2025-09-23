import { toPascalCase } from '$lib/util/string';
import type { TreeBuilder } from '.';
import type { ToType } from '../index.server';

export const toType: ToType<TreeBuilder> = (field) => {
	return `${field.name}: Array<Tree${toPascalCase(field.name)}>,`;
};
