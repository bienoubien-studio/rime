import type { AreaSlug, CollectionSlug, GenericDoc } from '$lib/types/doc.js';

export type DashboardEntry =
	| {
			slug: CollectionSlug;
			title: string;
			gender: 'm' | 'f';
			titleSingular: string;
			link: string;
			canCreate?: boolean;
			prototype: 'collection';
			lastEdited?: GenericDoc[];
	  }
	| {
			slug: AreaSlug;
			title: string;
			link: string;
			prototype: 'area';
			lastEdited?: GenericDoc[];
	  };
