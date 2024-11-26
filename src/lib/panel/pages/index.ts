import CollectionDocument from './collection-document/CollectionDocument.svelte';
import CollectionLayout from './collection-layout/CollectionLayout.svelte';
import ForgotPassword from './forgot-password/ForgotPassword.svelte';
import Global from './global/Global.svelte';
import Init from './init/Init.svelte';
import Live from './live/Live.svelte';
import Locked from './locked/Locked.svelte';
import Login from './login/Login.svelte';
import ResetPassword from './reset-password/ResetPassword.svelte';

export {
	CollectionDocument,
	CollectionLayout,
	ForgotPassword,
	Global,
	Init,
	Live,
	Locked,
	Login,
	ResetPassword
};

export * as pagesLoad from './index.load.server.js';
export * as pagesActions from './index.actions.server.js';
