import type { GenericDoc } from 'rizom/types';
import type { GlobalSlug } from 'rizom/types/doc';

export type GlobalProps = {
	data: GlobalData;
	slug: GlobalSlug;
};

type GlobalData =
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
			slug: GlobalSlug;
			readOnly: false;
	  };
