import type { Snippet } from 'svelte';
import type { CollectionSlug, GenericDoc } from 'rizom/types/doc';
import Area from './pages/area/Area.svelte';
import CollectionDoc from './pages/collection-document/CollectionDocument.svelte';
import CollectionLayout from './pages/collection-layout/CollectionLayout.svelte';
import ForgotPassword from './pages/forgot-password/ForgotPassword.svelte';
import Init from './pages/init/Init.svelte';
import Live from './pages/live/Live.svelte';
import LiveProvider from './components/areas/live/Provider.svelte';
import LiveConsumer from './components/areas/live/Consumer.svelte';
import Locked from './pages/locked/Locked.svelte';
import Login from './pages/login/Login.svelte';
import Panel from './components/root/Root.svelte';
import ResetPassword from './pages/reset-password/ResetPassword.svelte';
import Dashboard from './pages/dashboard/Dashboard.svelte';
import Collection from './components/areas/collection/Collection.svelte';
import Doc from './components/areas/document/Document.svelte';
import { Field } from './components/fields/index.js';
import { registerTranslation } from './i18n/index.js';

export {
	Area,
	CollectionDoc,
	CollectionLayout,
	ForgotPassword,
	Init,
	Live,
	LiveProvider,
	LiveConsumer,
	Locked,
	Login,
	Panel,
	ResetPassword,
	Dashboard,
	Collection,
	Doc,
	Field,
	registerTranslation
};

export type CollectionLayoutProps = {
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
