import { RizomError } from '$lib/core/errors/index.js';
import { buildConfigMap } from '../../configMap/index.js';
import { Hooks } from '../index.js';

export const buildOriginalDocConfigMap = Hooks.beforeUpsert(async (args) => {
	const { originalDoc } = args.context;

	if (!originalDoc) throw new RizomError(RizomError.OPERATION_ERROR, 'missing originalDoc @buildDataConfigMap');

	const originalConfigMap = buildConfigMap(originalDoc, args.config.fields);

	return {
		...args,
		context: {
			...args.context,
			originalConfigMap
		}
	};
});
