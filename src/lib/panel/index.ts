import type { Snippet } from 'svelte';
import type { CollectionSlug, GenericDoc } from '$lib/core/types/doc';
import Area from './pages/area/Area.svelte';
import CollectionDoc from './pages/collection-document/CollectionDocument.svelte';
import CollectionDocVersions from './pages/collection-document/CollectionDocVersions.svelte';
import AreaVersionsDoc from './pages/area/AreaVersionsDoc.svelte';
import Collection from './pages/collection/Collection.svelte';
import Live from './pages/live/Live.svelte';
import Panel from './components/Root.svelte';
import Dashboard from './pages/dashboard/Dashboard.svelte';
import Doc from './components/sections/document/Document.svelte';
import { Field } from './components/fields/index.js';
import type { VersionsStatus } from '$lib/core/constant.js';
import type { WithRequired } from '$lib/util/types.js';
import type { Route } from './types.js';

export { Area, AreaVersionsDoc, CollectionDocVersions, CollectionDoc, Collection, Live, Panel, Dashboard, Doc, Field };

export type { DocumentFormContext } from './context/documentForm.svelte.js';

export type CollectionProps = {
	data: {
		docs: GenericDoc[];
		status: number;
		canCreate: boolean;
	};
	children: Snippet;
};

export type DocVersion = { id: string; updatedAt: Date; status: VersionsStatus };

type BaseDocData = 
	| {
			aria: Partial<Route>[];
			doc: GenericDoc;
			status: 200;
			readOnly: boolean;
	  }
	| {
			aria: Partial<Route>[];
			doc: {};
			status: 401;
			readOnly: true;
	  };
type DocVersions<V> = (V extends true ? { versions: DocVersion[] } : {})

export type CollectionDocData<V extends boolean = boolean> = DocVersions<V> & BaseDocData & { operation : 'create' | 'update' };
export type AreaDocData<V extends boolean = boolean> = DocVersions<V> & BaseDocData & { operation : 'update' };
