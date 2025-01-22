/** Collection */

import { PACKAGE_NAME } from 'rizom/constant.js';

export const collectionLayoutServer = (slug: string) =>
	`import { pagesLoad } from '${PACKAGE_NAME}/panel/pages';
export const load = pagesLoad.collection.layout('${slug}')
`;

export const collectionLayoutSvelte = (slug: string) =>
	`<script lang="ts">
  import { CollectionLayout, type CollectionLayoutProps } from '${PACKAGE_NAME}/panel'
  const { data, children }: CollectionLayoutProps = $props();
</script>
<CollectionLayout {data} slug='${slug}'>
  {@render children()}
</CollectionLayout>
`;

export const collectionPageSvelte = () =>
	`<script>
  import { Collection } from '${PACKAGE_NAME}/panel'
  const { data } = $props()
</script>
<Collection slug={data.slug} />
`;

/** Collection Doc */

export const collectionDocServer = (slug: string) =>
	`import { pagesLoad, pagesActions } from '${PACKAGE_NAME}/panel/pages'

export const load = pagesLoad.collection.doc('${slug}')
export const actions = pagesActions.collection('${slug}')
`;

export const collectionDocSvelte = (slug: string) =>
	`<script lang="ts">
  import { CollectionDoc, type CollectionDocProps } from '${PACKAGE_NAME}/panel'
  const { data }: CollectionDocProps  = $props()
</script>
<CollectionDoc {data} slug='${slug}' />
`;

/** Collection API */

export const collectionAPIServer = (slug: string) =>
	`import * as api from '${PACKAGE_NAME}/api';

export const GET = api.collection.get('${slug}')
export const POST = api.collection.create('${slug}')
`;

export const collectionIdAPIServer = (slug: string) =>
	`import * as api from '${PACKAGE_NAME}/api';

export const GET = api.collection.getById('${slug}')
export const PATCH = api.collection.updateById('${slug}')
export const DELETE = api.collection.deleteById('${slug}')
`;

export const collectionAPIAuthLoginServer = (slug: string) =>
	`import * as api from '${PACKAGE_NAME}/api';
export const POST = api.collection.login('${slug}')
`;

export const collectionAPIAuthLogoutServer = () =>
	`import * as api from '${PACKAGE_NAME}/api';
export const POST = api.collection.logout
`;

export const collectionAPIAuthForgotPasswordServer = (slug: string) =>
	`import * as api from '${PACKAGE_NAME}/api';
export const POST = api.collection.forgotPassword('${slug}')
`;

/** Global */

export const globalPageServer = (slug: string) =>
	`import { pagesLoad, pagesActions } from '${PACKAGE_NAME}/panel/pages'

export const load = pagesLoad.global('${slug}')
export const actions = pagesActions.global('${slug}')
`;

export const globalPageSvelte = (slug: string) =>
	`<script>
  import { Global } from '${PACKAGE_NAME}/panel'
  const { data } = $props()
</script>
<Global {data} slug='${slug}' />
`;

export const globalAPIServer = (slug: string) =>
	`import * as api from '${PACKAGE_NAME}/api';

export const GET = api.global.get('${slug}')
export const POST = api.global.update('${slug}')
`;

// "/svelte-admin/src/lib/panel/BookingsOverview.svelte"
export const customRouteSvelte = (config: any) => {
	const componentReg = /([A-Z][a-zA-Z0-9]+)\.svelte$/;
	const match = config.component.match(componentReg);
	if (match) {
		const componentName = match[1];
		const componentPath = '$lib' + config.component.split('lib').at(-1);
		return `<script lang="ts">
      import ${componentName} from '${componentPath}'
    </script>
      <${componentName} />`;
	}

	return `Cannot parse provided component path`;
};
