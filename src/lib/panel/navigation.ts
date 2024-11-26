import type { User } from 'rizom/types/auth';
import type { BuiltConfig } from 'rizom/types/config';

const buildNavigation = (config: BuiltConfig, user: User | undefined): Dic => {
	//
	const groups: Dic = {
		none: []
	};

	for (const collection of config.collections) {
		if (user && collection.access.read(user)) {
			const route = {
				title: collection.name,
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

	for (const global of config.globals) {
		if (user && global.access.read(user)) {
			const route = {
				title: global.name,
				icon: global.slug,
				path: `/panel/${global.slug}`
			};
			if (global.group) {
				if (!(global.group in groups)) {
					groups[global.group] = [];
				}
				groups[global.group].push(route);
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
