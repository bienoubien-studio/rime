import type { Field } from 'rizom/types';
import type { CompiledArea, CompiledCollection } from 'rizom/types/config';
import { getValueAtPath, setValueAtPath } from 'rizom/utils/doc';
import type { Task } from 'rizom/operations/pipe/index.server';
import { RizomError } from 'rizom/errors';
import type { ConfigMap } from '../config-map/types';

export type FieldResolverServer = ReturnType<typeof createFieldResolver>;

export const provideFieldResolver = (target: 'incoming' | 'original') => {
	const task: Task<CompiledArea | CompiledCollection> = async (ctx, next) => {
		if (!ctx.data) throw new RizomError(RizomError.PIPE_ERROR, 'should never happen');
		if (!ctx.internal.configMap) throw new RizomError(RizomError.PIPE_ERROR, 'missing map');

		const getData = () => (target === 'incoming' ? ctx.data : ctx.original) || {};
		const resolverKey = `${target}FieldsResolver` as
			| 'incomingFieldsResolver'
			| 'originalFieldsResolver';

		ctx.internal[resolverKey] = createFieldResolver({
			data: getData,
			fields: ctx.config.fields,
			configMap: ctx.internal.configMap
		});

		await next();
	};
	return task;
};

type CreateFieldProviderArgs = {
	data: () => Record<string, any>;
	fields: Field[];
	configMap: ConfigMap;
};

export const createFieldResolver = (args: CreateFieldProviderArgs) => {
	const getValue = (path: string) => {
		return getValueAtPath<any>(args.data(), path);
	};
	const setValue = (path: string, value: any) => {
		setValueAtPath(args.data(), path, value);
	};

	const deleteValue = (path: string) => {
		const data = args.data();
		const parts = path.split('.');
		const last = parts.pop()!;

		let current = data;
		for (const part of parts) {
			if (!(part in current)) return;
			current = current[part];
		}

		delete current[last];
	};

	const useFieldServer = (path: string) => {
		return {
			get config() {
				return args.configMap[path];
			},
			get value() {
				return getValue(path);
			},
			set value(value) {
				setValue(path, value);
			},
			delete() {
				deleteValue(path);
			}
		};
	};

	return {
		getValue,
		useFieldServer
	};
};
