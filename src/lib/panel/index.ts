import type { Snippet } from 'svelte';
import type { CollectionSlug, GenericDoc } from '$lib/core/types/doc';
import Area from './pages/area/Area.svelte';
import CollectionDoc from './pages/collection-document/CollectionDocument.svelte';
import CollectionDocVersions from './pages/collection-document/CollectionDocVersions.svelte';
import AreaVersionsDoc from './pages/area/AreaVersionsDoc.svelte';
import CollectionList from './pages/collection-list/CollectionList.svelte';
import ForgotPassword from './pages/forgot-password/ForgotPassword.svelte';
import Init from './pages/init/Init.svelte';
import Live from './pages/live/Live.svelte';
import Locked from './pages/locked/Locked.svelte';
import Login from './pages/login/Login.svelte';
import Panel from './components/Root.svelte';
import ResetPassword from './pages/reset-password/ResetPassword.svelte';
import Dashboard from './pages/dashboard/Dashboard.svelte';
import Doc from './components/sections/document/Document.svelte';
import { Field } from './components/fields/index.js';

export {
	Area,
	AreaVersionsDoc,
	CollectionDocVersions,
	CollectionDoc,
	CollectionList,
	ForgotPassword,
	Init,
	Live,
	Locked,
	Login,
	Panel,
	ResetPassword,
	Dashboard,
	Doc,
	Field
};

export type { DocumentFormContext } from './context/documentForm.svelte.js';

export type CollectionListProps = {
	slug: CollectionSlug;
	data: {
		docs: GenericDoc[];
		status: number;
		canCreate: boolean;
	};
	children: Snippet;
};

export type CollectionDocProps = {
	slug: CollectionSlug;
	data: {
		docs: GenericDoc[];
		doc: GenericDoc;
		status: number;
		readOnly: boolean;
		operation: 'create' | 'update';
	};
};
