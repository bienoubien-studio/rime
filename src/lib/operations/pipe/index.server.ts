import type { RequestEvent } from '@sveltejs/kit';
import type { Adapter, GenericBlock, GenericDoc, LocalAPI, OperationQuery } from 'rizom/types';
import type { CompiledArea, CompiledCollection } from 'rizom/types/config';
import type { FieldResolverServer } from './tasks/shared/field-resolver/index.server';
import type { WithRequired } from 'rizom/types/utility';
import type { TreeBlock } from 'rizom/types/doc';
import type { RelationDiff } from './tasks/shared/relations/diff.server';
import { RizomError } from 'rizom/errors';
import type { ConfigMap } from './tasks/shared/config-map/types';

type BothConfigType = CompiledCollection | CompiledArea;
type Diff<T> = { toAdd: T[]; toDelete: T[]; toUpdate: T[] };
export type Context<T extends BothConfigType = BothConfigType> = {
	config: T;
	locale?: string;
	event: RequestEvent;
	api: LocalAPI;
	adapter: Adapter;
	operation: 'create' | 'read' | 'update' | 'delete';
	data?: Partial<GenericDoc>;
	document?: GenericDoc;
	original?: GenericDoc;
	documents?: GenericDoc[];
	query?: OperationQuery;
	sort?: string;
	limit?: number;
	depth?: number;
	internal: {
		configMap?: ConfigMap;
		originalFieldsResolver?: FieldResolverServer;
		incomingFieldsResolver?: FieldResolverServer;
		blocksDiff?: Diff<GenericBlock>;
		treeDiff?: Diff<WithRequired<TreeBlock, 'path'>>;
		relationsDiff?: RelationDiff;
	};
};

export type NextFunction = () => Promise<void>;
export type Task<T extends BothConfigType = BothConfigType> = (
	ctx: Context<T>,
	next: NextFunction
) => Promise<void>;

export function operationRunner<T extends BothConfigType = BothConfigType>(
	initialContext: Context<T>
) {
	const tasks: Task<T>[] = [];

	return {
		use(...fns: Task<T>[]) {
			tasks.push(...fns);
			return this;
		},
		async run() {
			let index = 0;
			const next = async () => {
				const task = tasks[index];
				index++;
				if (task) {
					await task(initialContext, next);
				}
			};
			await next();
			return initialContext;
		}
	};
}

export const stack =
	(singleTask: Task): Task =>
	async (ctx, next) => {
		if (!ctx.documents) {
			throw new RizomError(RizomError.PIPE_ERROR, 'Stack task requires documents array in context');
		}

		ctx.documents = await Promise.all(
			ctx.documents.map(async (doc) => {
				const localCtx = { ...ctx, documents: undefined };
				await singleTask(localCtx, async () => {});
				return localCtx.document!;
			})
		);

		await next();
	};
