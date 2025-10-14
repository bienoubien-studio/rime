import type { PanelConfig } from '$lib/core/config/types.js';
import type { User } from '$lib/types';
import { access } from '$lib/util';

export type WithPanelAccess<T extends { panel: PanelConfig }> = Omit<T, 'panel'> & {
	panel: T['panel'] & { $access: NonNullable<PanelConfig['$access']> }; // or whatever the type of $access is
};

export const augmentPanelAccess = <const T extends { panel: PanelConfig }>(
	config: T
): WithPanelAccess<T> => {
	const panel = {
		...config.panel,
		$access: config.panel?.$access ? config.panel.$access : (user?: User) => access.isAdmin(user)
	};

	return { ...config, panel } as const;
};
