import { PACKAGE_NAME } from '$lib/core/constant.js';
import { TScastVersionSlug, type Routes } from './util.js';

/**
 * Collection layout template
 * (rizom)/panel/{collection.slug}/+layout.svelte
 */
const layout = (slug: string) => `
<script lang="ts">
  import { CollectionLayout, type CollectionLayoutProps } from '${PACKAGE_NAME}/panel'
  const { data, children }: CollectionLayoutProps = $props();
</script>
<CollectionLayout {data} slug='${slug}'>
  {@render children()}
</CollectionLayout>`;

/**
 * Layout server template for collection
 * (rizom)/panel/{collection.slug}/+layout.server.ts
 */
const layoutServer = (slug: string) => `
import { pagesLoad } from '${PACKAGE_NAME}/panel/pages';
export const load = pagesLoad.collection.layout('${slug}')
`;

/**
 * Page template for collection list
 * (rizom)/panel/{collection.slug}/+page.svelte
 */
const page = () => `
<script>
  import { Collection } from '${PACKAGE_NAME}/panel'
  const { data } = $props()
</script>
<Collection slug={data.slug} />`;

/**
 * Document page template
 * (rizom)/panel/{collection.slug}/[id]/+page.svelte
 */
const docPage = (slug: string) => `
<script lang="ts">
  import { CollectionDoc, type CollectionDocProps } from '${PACKAGE_NAME}/panel'
  const { data }: CollectionDocProps = $props()
</script>
<CollectionDoc {data} slug='${slug}' />`;

/**
 * Document page server template
 * (rizom)/panel/{collection.slug}/[id]/+page.server.ts
 */
const docPageServer = (slug: string) => `
import { pagesLoad, pagesActions } from '${PACKAGE_NAME}/panel/pages'

export const load = pagesLoad.collection.doc('${slug}')
export const actions = pagesActions.collection.doc('${slug}')`;

/**
 * Document page versions template
 * (rizom)/panel/{collection.slug}/[id]/+page.svelte
 */
const docPageVersions = (slug: string) => `
<script lang="ts">
  import { CollectionVersionsDoc, type CollectionVersionsDocProps } from '${PACKAGE_NAME}/panel'
  const { data }: CollectionVersionsDocProps = $props()
</script>
<CollectionVersionsDoc {data} slug='${slug}' />`;

/**
 * Document page server template
 * (rizom)/panel/{collection.slug}/[id]/+page.server.ts
 */
const docPageVersionsServer = (slug: string) => `
import { pagesLoad, pagesActions } from '${PACKAGE_NAME}/panel/pages'

export const load = pagesLoad.collection.doc('${slug}')
export const actions = pagesActions.collection.doc('${slug}')`;

/**
 * API collection list operations
 * (rizom)/api/{collection.slug}/+server.ts
 */
const apiCollectionServer = (slug: string) => `
import * as api from '${PACKAGE_NAME}/api';

export const GET = api.collection.get(${TScastVersionSlug(slug)})
export const POST = api.collection.create(${TScastVersionSlug(slug)})
`

/**
 * API collection document operations
 * (rizom)/api/{collection.slug}/[id]/+server.ts
 */
const apiCollectionDocServer = (slug: string) => `
import * as api from '${PACKAGE_NAME}/api';

export const GET = api.collection.getById(${TScastVersionSlug(slug)})
export const PATCH = api.collection.updateById(${TScastVersionSlug(slug)})
export const DELETE = api.collection.deleteById(${TScastVersionSlug(slug)})
`;

/**
 * API collection auth document login
 * (rizom)/api/{collection.slug}/login/+server.ts
 */
const apiCollectionDocLoginServer = (slug: string) => `
import * as api from '${PACKAGE_NAME}/api';
export const POST = api.collection.login('${slug}')
`;

/**
 * API collection auth document logout
 * (rizom)/api/{collection.slug}/login/+server.ts
 */
const apiCollectionDocLogoutServer = (slug: string) => `
import * as api from '${PACKAGE_NAME}/api';
export const POST = api.collection.logout
`;

/**
 * Collection panel routes
 */
export const collectionPanelRoutes: Routes = {
  '(rizom)/panel/{collection.slug}/': {
    layout: layout,
    layoutServer: layoutServer,
    page: page
  },
  '(rizom)/panel/{collection.slug}/[id]': {
    page: docPage,
    pageServer: docPageServer
  }
};

/**
 * Collection verions panel routes
 */
export const collectionVersionsPanelRoutes: Routes = {
  '(rizom)/panel/{collection.slug}/[id]/versions': {
    page: docPageVersions,
    pageServer: docPageVersionsServer
  }
};

/**
 * Collection API routes
 */
export const collectionAPIRoutes: Routes = {
  '(rizom)/api/{collection.slug}/': {
    server: apiCollectionServer,
  },
  '(rizom)/api/{collection.slug}/[id]': {
    server: apiCollectionDocServer,
  }
}

/**
 * Collection Auth API routes
 */
export const collectionAPIAuthRoutes: Routes = {
  '(rizom)/api/{collection.slug}/login': {
    server: apiCollectionDocLoginServer,
  },
  '(rizom)/api/{collection.slug}/logout': {
    server: apiCollectionDocLogoutServer,
  }
}