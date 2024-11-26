import { redirect, type ServerLoadEvent } from "@sveltejs/kit";

export const forgotPasswordLoad = async ({ locals }: ServerLoadEvent) => {
  const { session } = locals;
  if (session) {
    throw redirect(302, '/');
  } else {
    return { form: {} };
  }
};