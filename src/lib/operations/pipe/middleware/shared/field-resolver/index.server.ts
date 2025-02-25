import type { Field, GenericDoc } from 'rizom/types';
import type { CompiledAreaConfig, CompiledCollectionConfig } from 'rizom/types/config';
import { buildConfigMap } from './map/map.server';
import { flatten } from 'flat';
import type { ConfigMap } from './map/types';
import { getValueAtPath, setValueAtPath } from 'rizom/utils/doc';
import type { Middleware } from 'rizom/operations/pipe/index.server';
import { RizomError } from 'rizom/errors';

export type FieldResolverServer = ReturnType<typeof createFieldResolver>;

export const provideFieldResolver = (target: 'incoming' | 'original') => {
	const middelware: Middleware<CompiledAreaConfig | CompiledCollectionConfig> = async (
		ctx,
		next
	) => {
		if (!ctx.data) {
			throw new RizomError(RizomError.PIPE_ERROR, 'should never happen');
		}
		const getData = () => (target === 'incoming' ? ctx.data : ctx.original) || {};
		const resolverKey = `${target}FieldsResolver` as
			| 'incomingFieldsResolver'
			| 'originalFieldsResolver';

		ctx.internal.configMap = ctx.internal.configMap
			? ctx.internal.configMap
			: buildConfigMap(getData(), ctx.config.fields);

		ctx.internal[resolverKey] = createFieldResolver({
			data: () => getData,
			fields: ctx.config.fields,
			configMap: ctx.internal.configMap
		});

		await next();
	};
	return middelware;
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
