import { RizomError } from '$lib/core/errors/index.js';
import { Hooks } from '$lib/core/operations/hooks/index.server.js';

export const preventSupperAdminDeletion = Hooks.beforeDelete(async (args) => {
	const { doc, event } = args;
	const isSuperAdminDeletion = await event.locals.rizom.auth.isSuperAdmin(doc.id);
	if (isSuperAdminDeletion) {
		throw new RizomError(RizomError.UNAUTHORIZED, "This user can't be deleted");
	}
	return args;
});
