import type { LayoutServerLoadEvent } from './$types';

export const ssr = false;

export const load = async (event: LayoutServerLoadEvent) => {
  const { api } = event.locals;
  const menu = await api.global('menu').find<CMS.MenuDoc>();
  return { menu };
};
