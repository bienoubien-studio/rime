import type { User } from '$lib/core/collections/auth/types';
import type { CompiledConfig } from '$lib/core/config/types';
import type { Dic } from '$lib/util/types';

interface Route {
	title: string;
	icon: string;
	path: string;
}

/**
 * Builds navigation structure based on config and user permissions
 * @param config - Compiled configuration object
 * @param user - Current user object (optional)
 * @returns Dictionary of navigation groups
 */
const buildNavigation = (config: CompiledConfig, user: User | undefined): Dic => {
	const groups: Dic = {};
	
	/**
	 * Adds a route to the appropriate navigation group
	 */
	const addRouteToGroup = (route: Route, group?: string) => {
		if (group) {
			if (!(group in groups)) {
				groups[group] = [];
			}
			groups[group].push(route);
		} else {
			groups.none.push(route);
		}
	};

	// Process collections
	config.collections
		.filter((collection) => collection.panel !== false)
		.forEach((collection) => {
			if (user && collection.access.read(user, {})) {
				const route: Route = {
					title: collection.label.plural,
					icon: collection.slug,
					path: `/panel/${collection.slug}`
				};
				addRouteToGroup(route, collection.panel && collection.panel?.group || 'collections');
			}
		});

	// Process areas
	config.areas.forEach((area) => {
		if (user && area.access.read(user, {})) {
			const route: Route = {
				title: area.label,
				icon: area.slug,
				path: `/panel/${area.slug}`
			};
			addRouteToGroup(route, area.panel && area.panel?.group || 'areas');
		}
	});

	// Process custom panel routes
	Object.entries(config.panel.routes).forEach(([routePath, routeConfig]) => {
		const route: Route = {
			title: routeConfig.label,
			icon: `custom-${routePath}`,
			path: `/panel/${routePath}`
		};
		addRouteToGroup(route, routeConfig.group);
	});

	return groups;
};

export default buildNavigation;

export type Navigation = ReturnType<typeof buildNavigation>;
