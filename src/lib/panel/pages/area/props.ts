import type { AreaSlug, GenericDoc, VersionDoc } from '$lib/core/types/doc';
import type { Aria } from '$lib/panel/types.js';

export type AreaProps = {
	data: AreaLoadReturn;
	slug: AreaSlug;
};

export type AreaLoadReturn =
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
			aria: Aria;
			versions?: VersionDoc[];
	  }
	| {
			status: 200;
			doc: GenericDoc;
			operation: 'update';
			slug: AreaSlug;
			readOnly: false;
			aria: Aria;
			versions?: VersionDoc[];
	  };
