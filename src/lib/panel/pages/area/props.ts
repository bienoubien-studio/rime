import type { AreaSlug, GenericDoc } from '$lib/types/doc';

export type AreaProps = {
	data: AreaData;
	slug: AreaSlug;
};

export type AreaData =
	| {
			status: 401;
			doc: {};
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
