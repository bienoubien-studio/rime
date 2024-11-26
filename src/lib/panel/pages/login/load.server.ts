import { redirect, type ServerLoadEvent } from '@sveltejs/kit';

export const loginLoad = async ({ locals }: ServerLoadEvent) => {
  const { session } = locals;
  if (session) {
    throw redirect(302, '/panel');
  } else {
    return { form: {} };
  }
};
