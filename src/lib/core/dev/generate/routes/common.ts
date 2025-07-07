import { PACKAGE_NAME } from '$lib/core/constant.js';
import type { Routes } from './util.js';

/**
 * Main base layout
 * /+layout.server.ts
 */
const mainLayout = (): string => `
import type { ServerLoadEvent } from '@sveltejs/kit';
export const load = async ({ locals }: ServerLoadEvent) => {
  return { user: locals.user };
};`;

/**
 * Error page template
 * (rizom)/+error.svelte
 */
const error = (): string => `
<script>
	import { page } from '$app/state';
</script>

<div class="container">
	<h1>Error {page.status}</h1>
	|
	<p>
		{page.error?.message}
	</p>
</div>`;

/**
 * Root layout template
 * (rizom)/+layout.svelte
 */
const rootLayout = () => `
<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Dictionaries } from 'rizom/i18n';
	import i18n from 'rizom/i18n';
	import 'rizom/panel/style/index.css';

	type Props = { children: Snippet; data: { translations: Dictionaries } };

	const { children, data }: Props = $props();
	i18n.init(data.translations);

</script>

<div class="rz-root">
	{@render children()}
</div>`;

/**
 * Root layout server template
 * (rizom)/+layout.server.ts
 */
const rootLayoutServer = () => `
import type { ServerLoadEvent } from '@sveltejs/kit';
import { registerTranslation } from '${PACKAGE_NAME}/i18n/register.server.js';

export const ssr = false;

export const load = async ({ locals }: ServerLoadEvent) => {
	const { user, rizom } = locals;
	const translations = await registerTranslation(rizom.config.raw.panel.language);
	return { user, translations };
};`;

/**
 * Login page template
 * (rizom)/panel/sign-in/+page.svelte
 */
const signInPage = () => `
<script lang="ts">
  import { SignIn } from '${PACKAGE_NAME}/panel/auth/client';
  const { data } = $props();
</script>

<SignIn {data} />`;

/**
 * Login page server template
 * (rizom)/auth/sign-in/+page@(rizom).server.ts
 */
const signInPageServer = () => `
import { authLoads, authActions } from '${PACKAGE_NAME}/panel/auth';

export const load = authLoads.signIn;
export const actions = authActions.signIn;
`;

/**
 * Forgot password page template
 * (rizom)/forgot-password/+page.svelte
 */
const forgotPasswordPage = () => `
<script>
  import { ForgotPassword } from '${PACKAGE_NAME}/panel/auth/client'
</script>
<ForgotPassword />`;

/**
 * Forgot password page server template
 * (rizom)/forgot-password/+page.server.ts
 */
const forgotPasswordPageServer = () => `
import { authLoads } from '${PACKAGE_NAME}/panel/auth';

export const load = authLoads.forgotPassword;
`;

/**
 * Reset password page template
 * (rizom)/reset-password/+page.svelte
 */
const resetPasswordPage = () => `
<script lang="ts">
  import { ResetPassword } from '${PACKAGE_NAME}/panel';
  const { data } = $props();
</script>

<ResetPassword slug={data.slug} token={data.token} />`;

/**
 * Reset password page server template
 * (rizom)/reset-password/+page.server.ts
 */
const resetPasswordPageServer = () => `
import { pagesLoad } from '${PACKAGE_NAME}/panel/pages';

export const load = pagesLoad.resetPassword;
`;

/**
 * Panel layout template
 * (rizom)/panel/+layout.svelte
 */
const panelLayout = () => `
<script>
	import { Panel } from '${PACKAGE_NAME}/panel';
	//@ts-ignore
	import config from 'virtual:browser-config';
	const { children, data } = $props();

	const user = data.user;
	if (!user) throw new Error('unauthorized');
</script>

<Panel {config} {user} routes={data.routes} locale={data.locale}>
    {@render children()}
</Panel>`;

/**
 * Panel layout server template
 * (rizom)/panel/+layout.server.ts
 */
const panelLayoutServer = () => `
import { type ServerLoadEvent } from '@sveltejs/kit';

export const load = async ({ locals }: ServerLoadEvent) => {
  const { user, locale, routes } = locals;
  return { user, locale, routes };
};`;

/**
 * Panel page template
 * (rizom)/panel/+page.svelte
 */
const panelPage = () => `
<script>
  import { Dashboard } from '${PACKAGE_NAME}/panel';
  const { data } = $props();
</script>

<Dashboard entries={data.entries} user={data.user} />`;

/**
 * Panel page load template
 * (rizom)/panel/+page.server.ts
 */
const panelPageServer = () => `
import { pagesLoad } from '${PACKAGE_NAME}/panel/pages';

export const load = pagesLoad.dashboard;`;

/**
 * Live page template
 * (rizom)/live/+page.svelte
 */
const livePage = () => `
<script lang="ts">
  import { Live } from '${PACKAGE_NAME}/panel';
  //@ts-ignore
  import config from 'virtual:browser-config';

  const { data } = $props();
</script>


<Live {data} config={config} />`;

/**
 * Live page server template
 * (rizom)/live/+page.server.ts
 */
const livePageServer = () => `
import { pagesLoad } from '${PACKAGE_NAME}/panel/pages';

export const load = pagesLoad.live;`;

/**
 * Custom route template generator
 * Used for generating custom routes
 */
const customRoute = (config: any): string => {
	let componentPath: string = '';
	let componentName: string = '';

	const rawPath =
		typeof config.component === 'string'
			? config.component
			: config.component[Symbol.for('filename')] || (config.component as any)[Symbol('filename')];

	if (rawPath) {
		const componentReg = /([A-Z][a-zA-Z0-9]+)\.svelte$/;
		const match = rawPath.match(componentReg);
		if (match) {
			componentName = match[1];

			if (rawPath.includes('node_modules/')) {
				componentPath = 'node_modules/' + rawPath.split('node_modules/').at(-1);
			} else {
				componentPath = '$lib/' + rawPath.split('lib/').at(-1);
			}
		}
	}

	if (componentName && componentPath) {
		return `<script lang="ts">
  import ${componentName} from '${componentPath}'
  const { data } = $props()
</script>
<${componentName} {data} />`;
	}

	return `Cannot parse provided component path`;
};

// Shared routes dictionary
export const commonRoutes: Routes = {
	'': {
		layoutServer: mainLayout
	},
	'(rizom)': {
		layout: rootLayout,
		layoutServer: rootLayoutServer,
		error: error
	},
	'(rizom)/panel/sign-in': {
		'page@(rizom)': signInPage,
		'pageServer': signInPageServer
	},
	'(rizom)/forgot-password': {
		page: forgotPasswordPage,
		pageServer: forgotPasswordPageServer
	},
	'(rizom)/reset-password': {
		page: resetPasswordPage,
		pageServer: resetPasswordPageServer
	},
	'(rizom)/panel': {
		layout: panelLayout,
		layoutServer: panelLayoutServer,
		page: panelPage,
		pageServer: panelPageServer
	},
	'(rizom)/live': {
		page: livePage,
		pageServer: livePageServer
	}
};

export { customRoute };
