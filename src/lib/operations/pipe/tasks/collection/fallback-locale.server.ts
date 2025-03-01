import type { CompiledCollection } from 'rizom/types/config';
import type { Task } from '../../index.server';
import type { Dic } from 'rizom/types/utility';
import { RizomError } from 'rizom/errors';

export const fallbackLocale = (incomingData: Dic) => {
	const task: Task<CompiledCollection> = async (ctx, next) => {
		if (!ctx.document) throw new RizomError(RizomError.PIPE_ERROR, 'should never happen');

		const { rizom } = ctx.event.locals;
		const id = ctx.document.id;

		const locales = rizom.config.getLocalesCodes();
		if (locales.length) {
			if ('file' in incomingData) {
				delete incomingData.file;
			}
			if ('filename' in incomingData) {
				delete incomingData.filename;
			}

			const otherLocales = locales.filter((code) => code !== ctx.locale);
			for (const otherLocale of otherLocales) {
				ctx.api.enforceLocale(otherLocale);
				await ctx.api
					.collection(ctx.config.slug)
					.updateById({ id, data: incomingData, locale: otherLocale });
			}
		}
		await next();
	};
	return task;
};
