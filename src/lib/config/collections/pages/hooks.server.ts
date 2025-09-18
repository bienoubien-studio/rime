import { collection } from '$rizom/core';

const populateCustom = collection.hook.beforeRead<'pages'>(async (args) => {
	args.doc.custom = 'custom-prop';
	return args;
});

export const hooks = collection.hooks({
	beforeRead: [populateCustom]
});
