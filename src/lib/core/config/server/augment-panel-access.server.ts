import type { PanelConfig } from '$lib/core/config/types.js';
import type { User } from '$lib/types';
import { access } from '$lib/util';

export const augmentPanelAccess = <const T extends { panel: PanelConfig }>(config: T) => {
	const panel = {
		...config.panel,
		$access: config.panel?.$access ? config.panel.$access : (user?: User) => access.isAdmin(user)
	};

	return { ...config, panel } as const;
};
