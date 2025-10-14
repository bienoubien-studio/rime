import { createRime } from '../../rime.server.js';
import { augmentPanel } from '../client/augment-panel.js';
import { augmentPlugins } from '../client/augment-plugins.js';
import { augmentIcons } from '../shared/augment-icons.js';
import { augmentPrototypes } from '../shared/augment-prototypes.js';
import { makeUploadDirectoriesCollections } from '../shared/upload-directories.js';
import { makeVersionsCollectionsAliases } from '../shared/versions-alias.server.js';
import type { Config } from '../types.js';
import { augmentCORS } from './augment-cors.js';
import { augmentPanelAccess } from './augment-panel-access.server.js';
import { augmentPluginsServer } from './augment-plugins.server.js';
import { augmentStaffServer } from './augment-staff.server.js';

export const buildConfig = <const C extends Config>(config: C) => {
	const augmented = augmentConfig(config);
	// Versions collection aliases
	// create {slug}_versions collections
	const withVersions = makeVersionsCollectionsAliases(augmented);
	// Upload collection directories
	// create {slug}_directories collections
	const output = makeUploadDirectoriesCollections(withVersions);

	return createRime(output as any as BuildConfig<C>);
};

function augmentConfig<T extends Config>(config: T) {
	const withStaff = augmentStaffServer(config);
	const withPrototype = augmentPrototypes(withStaff);
	const withIcons = augmentIcons(withPrototype);
	const withPanel = augmentPanel(withIcons);
	const withPanelAccess = augmentPanelAccess(withPanel);
	const withCORS = augmentCORS(withPanelAccess);
	const withPluginsServer = augmentPluginsServer(withCORS);
	const output = augmentPlugins(withPluginsServer);
	return output;
}

type InferCorePlugins = {
	cache: import('$lib/core/plugins/cache/index.server.js').CacheActions;
	sse: import('$lib/core/plugins/sse/index.server.js').SSEActions;
	mailer?: import('$lib/core/plugins/mailer/index.server.js').MailerActions;
};

// Helper type to extract custom plugins from original config
type ExtractCustomPlugins<C> = C extends { $plugins: readonly (infer P)[] }
	? P extends { name: infer N; actions?: infer A }
		? N extends string
			? Record<N, NonNullable<A>>
			: never
		: never
	: Record<string, never>;

type InferPluginsServer<C> = InferCorePlugins & ExtractCustomPlugins<C>;

export type BuildConfig<C extends Config = Config> = ReturnType<typeof augmentConfig<C>> & {
	readonly $InferAuthPlugins: C['$auth'] extends { plugins: any } ? C['$auth']['plugins'] : [];
	readonly $InferRoutes: C['$routes'] extends Record<string, any> ? C['$routes'] : unknown;
	readonly $InferPluginsServer: InferPluginsServer<C>;
};
