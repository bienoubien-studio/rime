import type { User } from 'rizom/types/auth';
import type { CompiledConfig } from 'rizom/types/config';
import type { Dic } from 'rizom/types/utility';

const buildNavigation = (config: CompiledConfig, user: User | undefined): Dic => {
	//
	const groups: Dic = {
		none: []
	};

	for (const collection of config.collections) {
		if (user && collection.access.read(user)) {
			const route = {
				title: collection.label.plural,
				icon: collection.slug,
				path: `/panel/${collection.slug}`
			};
			if (collection.group) {
				if (!(collection.group in groups)) {
					groups[collection.group] = [];
				}
				groups[collection.group].push(route);
			} else {
				groups.none.push(route);
			}
		}
	}

	for (const area of config.areas) {
		if (user && area.access.read(user)) {
			const route = {
				title: area.label,
				icon: area.slug,
				path: `/panel/${area.slug}`
			};
			if (area.group) {
				if (!(area.group in groups)) {
					groups[area.group] = [];
				}
				groups[area.group].push(route);
			} else {
				groups.none.push(route);
			}
		}
	}

	for (const [routePath, routeConfig] of Object.entries(config.panel.routes)) {
		const route = {
			title: routeConfig.label,
			icon: `custom-${routePath}`,
			path: `/panel/${routePath}`
		};
		if (routeConfig.group) {
			if (!(routeConfig.group in groups)) {
				groups[routeConfig.group] = [];
			}
			groups[routeConfig.group].push(route);
		} else {
			groups.none.push(route);
		}
	}

	return groups;
};

export default buildNavigation;

export type Navigation = ReturnType<typeof buildNavigation>;
