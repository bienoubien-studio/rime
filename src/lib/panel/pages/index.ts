import CollectionDocVersions from './collection-document/CollectionDocVersions.svelte';
import AreaVersionsDoc from './area/AreaVersionsDoc.svelte';
import CollectionDocument from './collection-document/CollectionDocument.svelte';
import Collection from './collection/Collection.svelte';
import Area from './area/Area.svelte';
import Live from './live/Live.svelte';

export {
	CollectionDocVersions,
	CollectionDocument,
	Collection,
	Area,
	AreaVersionsDoc,
	Live,
};

export * as pagesLoad from './index.load.server.js';
export * as pagesActions from './index.actions.server.js';
