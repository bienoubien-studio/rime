import type { GenericDoc } from 'rizom/types/doc.js';
import { hash } from './utils.server.js';
import type {
	CollectionHookBeforeCreate,
	CollectionHookBeforeDelete,
	CollectionHookBeforeUpdate
} from 'rizom/types/hooks.js';

export const beforeUpdate: CollectionHookBeforeUpdate = async (args) => {
	const data = args.data as GenericDoc;
	if (data.password) {
		const hashedPassword = await hash(data.password);
		data.hashedPassword = hashedPassword;
		delete data.password;
	}
	return { ...args, data };
};

export const beforeCreate: CollectionHookBeforeCreate = async (args) => {
	const { rizom } = args;
	const authUserId = await rizom.auth.createAuthUser(args.config.slug);
	if (args.data.password) {
		const hashedPassword = await hash(args.data.password);
		args.data.hashedPassword = hashedPassword;
		delete args.data.password;
	}
	return {
		...args,
		data: {
			...args.data,
			authUserId
		}
	};
};

export const beforeDelete: CollectionHookBeforeDelete = async (args) => {
	const { doc, rizom } = args;
	await rizom.auth.deleteAuthUserById(doc.authUserId);
	return args;
};
