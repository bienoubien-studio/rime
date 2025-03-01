import type { GenericDoc } from 'rizom/types';
import type { Task } from '../../index.server';
import { RizomError } from 'rizom/errors';
import { flatten, unflatten } from 'flat';
import type { Dic } from 'rizom/types/utility';

export const postprocessFields = (args?: { multiple: boolean }) => {
	const multiple = args?.multiple || false;
	const task: Task = async (ctx, next) => {
		if (!ctx.internal.configMap) throw new RizomError(RizomError.PIPE_ERROR, 'missing configMap');

		const flatDoc: Dic = flatten(ctx.document);

		for (const [key, config] of Object.entries(ctx.internal.configMap)) {
			//
			if (config.access && config.access.read) {
				const authorized = config.access.read(ctx.event.locals.user);
				if (!authorized) {
					delete flatDoc[key];
					continue;
				}
			}

			if (config.hooks?.beforeRead) {
				if (flatDoc[key]) {
					for (const hook of config.hooks.beforeRead) {
						flatDoc[key] = await hook(flatDoc[key], { config, api: ctx.api, locale: ctx.locale });
					}
				}
			}
		}

		ctx.document = unflatten(flatDoc);

		await next();
	};
	return task;
};
