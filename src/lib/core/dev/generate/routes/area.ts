import { PACKAGE_NAME } from '$lib/core/constant.js';
import { TScastVersionSlug, type Routes } from './util.js';

/**
 * Area templates defined outside of the routes object
 * (rizom)/panel/{area.slug}/+page.svelte
 */
const pageTemplate = (slug: string): string => `
<script>
  import { Area } from '${PACKAGE_NAME}/panel'
  const { data } = $props()
</script>
<Area {data} slug='${slug}' />`;

/**
 * Page server template for area
 * (rizom)/panel/{area.slug}/+page.server.ts
 */
const pageServerTemplate = (slug: string): string => `
import { pagesLoad, pagesActions } from '${PACKAGE_NAME}/panel/pages'

export const load = pagesLoad.area('${slug}')
export const actions = pagesActions.area('${slug}')
`;

/**
 * API collection list operations
 * (rizom)/api/{collection.slug}/+server.ts
 */
const apiAreaServer = (slug: string): string => `
import * as api from '${PACKAGE_NAME}/api';

export const GET = api.area.get('${TScastVersionSlug(slug)}')
export const POST = api.area.update('${TScastVersionSlug(slug)}')
`

/**
 * Area routes dictionary defining route patterns and their corresponding templates
 */
export const areaRoutes: Routes = {
  '(rizom)/panel/{area.slug}/': {
    page: pageTemplate,
    pageServer: pageServerTemplate
  },
};

export const areaAPIRoutes: Routes = {
  '(rizom)/api/{area.slug}/': {
    server: apiAreaServer,
  },
};
