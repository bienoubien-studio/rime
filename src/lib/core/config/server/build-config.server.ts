import { createRime } from '../../rime.server.js';
import { augmentPanel, type WithPanel } from '../client/augment-panel.js';
import { augmentPlugins, type WithPlugins } from '../client/augment-plugins.js';
import { augmentIcons, type WithIcons } from '../shared/augment-icons.js';
import { augmentPrototypes, type WithPrototypes } from '../shared/augment-prototypes.js';
import { makeUploadDirectoriesCollections } from '../shared/upload-directories.js';
import { makeVersionsCollectionsAliases } from '../shared/versions-alias.server.js';
import type { Config } from '../types.js';
import { augmentCORS, type WithCORS } from './augment-cors.js';
import { augmentPanelAccess, type WithPanelAccess } from './augment-panel-access.server.js';
import { augmentPluginsServer, type WithPluginsServer } from './augment-plugins.server.js';
import { augmentStaffServer } from './augment-staff.server.js';

export const buildConfig = <const C extends Config>(config: C) => {
	const withStaff = augmentStaffServer(config);
	const withPrototype = augmentPrototypes(withStaff);
	const withIcons = augmentIcons(withPrototype);
	const withPanel = augmentPanel(withIcons);
	const withPanelAccess = augmentPanelAccess(withPanel);
	const withCORS = augmentCORS(withPanelAccess);
	const withPluginsServer = augmentPluginsServer(withCORS);
	const builtConfig = augmentPlugins(withPluginsServer);
	// Versions collection aliases
	// create {slug}_versions collections
	const withVersions = makeVersionsCollectionsAliases(builtConfig);
	// Upload collection directories
	// create {slug}_directories collections
	const output = makeUploadDirectoriesCollections(withVersions);

	return createRime(output as any as BuildConfig<C>);
};

export type BuildConfig<C extends Config = Config> = WithPlugins<
	WithPluginsServer<WithCORS<WithPanelAccess<WithPanel<WithIcons<WithPrototypes<C>>>>>>
> & {
	readonly $InferAuthPlugins: C['$auth'] extends { plugins: any } ? C['$auth']['plugins'] : [];
	readonly $InferRoutes: C['$routes'] extends Record<string, any> ? C['$routes'] : unknown;
};
