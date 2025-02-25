import type { RequestEvent } from '@sveltejs/kit';
import type { Adapter, GenericBlock, GenericDoc, LocalAPI } from 'rizom/types';
import type { CompiledAreaConfig, CompiledCollectionConfig } from 'rizom/types/config';
import type { ConfigMap } from './middleware/shared/field-resolver/map/types';
import type { FieldResolverServer } from './middleware/shared/field-resolver/index.server';
import type { WithRequired } from 'rizom/types/utility';
import type { TreeBlock } from 'rizom/types/doc';

type BothConfigType = CompiledCollectionConfig | CompiledAreaConfig;
type Diff<T> = { toAdd: T[]; toDelete: T[]; toUpdate: T[] };
export type Context<T extends BothConfigType = BothConfigType> = {
	config: T;
	locale?: string;
	event: RequestEvent;
	api: LocalAPI;
	adapter: Adapter;
	operation: 'create' | 'read' | 'update' | 'delete';
	data?: Record<string, any>;
	document?: GenericDoc;
	original?: GenericDoc;
	internal: {
		configMap?: ConfigMap;
		originalFieldsResolver?: FieldResolverServer;
		incomingFieldsResolver?: FieldResolverServer;
		blocksDiff?: Diff<GenericBlock>;
		treeDiff?: Diff<WithRequired<TreeBlock, 'path'>>;
	};
};

export type NextFunction = () => Promise<void>;
export type Middleware<T extends BothConfigType = BothConfigType> = (
	ctx: Context<T>,
	next: NextFunction
) => Promise<void>;

export function createPipe<T extends BothConfigType = BothConfigType>(initialContext: Context<T>) {
	const middlewares: Middleware<T>[] = [];

	return {
		use(...fns: Middleware<T>[]) {
			middlewares.push(...fns);
			return this;
		},
		async run() {
			let index = 0;
			const next = async () => {
				const middleware = middlewares[index];
				index++;
				if (middleware) {
					await middleware(initialContext, next);
				}
			};
			await next();
			return initialContext;
		}
	};
}
