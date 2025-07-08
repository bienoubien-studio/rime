import type { HookBeforeDelete } from "$lib/core/config/types/index.js";
import { RizomError } from "$lib/core/errors/index.js";
import type { GenericDoc } from "$lib/core/types/doc.js";

export const preventSupperAdminDeletion: HookBeforeDelete<GenericDoc> = async (args) => {
  const { doc, rizom } = args;
  const isSuperAdminDeletion = await rizom.auth.isSuperAdmin(doc.id);
  if (isSuperAdminDeletion) {
    throw new RizomError(RizomError.UNAUTHORIZED, "This user can't be deleted");
  }
  return args;
};