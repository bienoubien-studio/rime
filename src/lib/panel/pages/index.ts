import CollectionDocVersions from './collection-document/CollectionDocVersions.svelte';
import AreaVersionsDoc from './area/AreaVersionsDoc.svelte';
import CollectionDocument from './collection-document/CollectionDocument.svelte';
import Collection from './collection/Collection.svelte';
import ForgotPassword from './forgot-password/ForgotPassword.svelte';
import Area from './area/Area.svelte';
import Init from './init/Init.svelte';
import Live from './live/Live.svelte';
import Locked from './locked/Locked.svelte';
import Login from './login/Login.svelte';
import ResetPassword from './reset-password/ResetPassword.svelte';

export {
	CollectionDocVersions,
	CollectionDocument,
	Collection,
	ForgotPassword,
	Area,
	AreaVersionsDoc,
	Init,
	Live,
	Locked,
	Login,
	ResetPassword
};

export * as pagesLoad from './index.load.server.js';
export * as pagesActions from './index.actions.server.js';
