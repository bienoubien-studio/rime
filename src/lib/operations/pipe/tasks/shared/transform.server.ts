import type { GenericDoc } from 'rizom/types';
import type { Task } from '../../index.server';
import { privateFieldNames } from 'rizom/collection/auth/privateFields.server';
import { omit } from 'rizom/utils/object';
import { RizomError } from 'rizom/errors';
import type { Dic } from 'rizom/types/utility';
import { flatten, unflatten } from 'flat';

export const transformDocument: Task = async (ctx, next) => {
	const { configMap } = ctx.internal;
	const { data } = ctx;

	if (!data) throw new RizomError(RizomError.PIPE_ERROR, 'should never happend');
	if (!configMap) throw new RizomError(RizomError.PIPE_ERROR, 'missing configMap');

	let output = await ctx.adapter.transform.doc({
		doc: data,
		slug: ctx.config.slug,
		locale: ctx.locale,
		event: ctx.event,
		api: ctx.api,
		depth: ctx.depth
	});

	// should be handle by field hook
	const isLive = ctx.event.url.pathname.startsWith('/live');
	const isPanel = ctx.event.url.pathname.startsWith('/panel') || isLive;
	const keysToDelete = privateFieldNames;
	if (!isPanel || !ctx.event.locals.user) {
		keysToDelete.push('authUserId', 'editedBy');
	}
	for (const key of keysToDelete) {
		delete output[key];
	}
	// ---------

	const flatDoc: Dic = flatten(output);
	for (const [key, config] of Object.entries(configMap)) {
		//
		if (config.access && config.access.read) {
			const authorized = config.access.read(ctx.event.locals.user, { id: data.id });
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

	output = unflatten(flatDoc);

	// Add locale
	if (ctx.locale) {
		output.locale = ctx.locale;
	}

	// type and prototype
	output._prototype = ctx.config.type;
	output._type = ctx.config.slug;

	// populate title
	if (!('title' in output)) {
		output = {
			title: output[ctx.config.asTitle],
			...output
		};
	}

	// populate urls
	if (ctx.config.url) {
		output.url = ctx.config.url(output as any);
	}
	if (ctx.config.live && ctx.event.locals.user && ctx.config.url) {
		output._live = `${process.env.PUBLIC_RIZOM_URL}/live?src=${output.url}&slug=${ctx.config.slug}&id=${output.id}`;
		output._live += ctx.locale ? `&locale=${ctx.locale}` : '';
	}

	await next();
};
