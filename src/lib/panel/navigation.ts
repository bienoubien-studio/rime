import type { User } from '$lib/types/auth';
import type { CompiledConfig } from '$lib/types/config';
import type { Dic } from '$lib/types/util';

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
	const groups: Dic = {
		none: [] // Default group for ungrouped items
	};

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
	config.collections.forEach((collection) => {
		if (user && collection.access.read(user, {})) {
			const route: Route = {
				title: collection.label.plural,
				icon: collection.slug,
				path: `/panel/${collection.slug}`
			};
			addRouteToGroup(route, collection.group);
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
			addRouteToGroup(route, area.group);
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
