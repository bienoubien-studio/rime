import type { AreaSlug, GenericDoc } from '$lib/core/types/doc';

export type AreaProps = {
	data: AreaData;
	slug: AreaSlug;
};

export type AreaData =
	| {
			status: 401;
			doc: Record<never, never>;
			operation: 'update';
	  }
	| {
			status: 200;
			doc: GenericDoc;
			operation: 'update';
			readOnly: true;
	  }
	| {
			status: 200;
			doc: GenericDoc;
			operation: 'update';
			slug: AreaSlug;
			readOnly: false;
	  };
