import { fail, redirect, error, type RequestEvent } from '@sveltejs/kit';
import { extractData } from 'rizom/operations/data.server.js';
import type { PanelActionFailure } from 'rizom/types/panel';

type ResetPasswordForm = {
	password?: string;
	confirmPassword?: string;
};

type ResetPasswordActionFailure = PanelActionFailure<ResetPasswordForm>;

export const resetPasswordActions = {
	default: async (event: RequestEvent) => {
		throw new Error('not implemented');
		// const { request, locals } = event;
		// const { rizom, api } = locals;

		// const data = await extractData(request);
		// const { password, confirmPassword, slug, token, userId } = data;

		// if (password !== confirmPassword) {
		// 	return fail<ResetPasswordActionFailure>(400, {
		// 		errors: { password: 'Password missmatch', confirmPassword: 'Password missmatch' }
		// 	});
		// }

		// const isValidToken = await rizom.auth.verifyForgotPasswordToken({
		// 	token,
		// 	userTableName: slug,
		// 	id: userId
		// });

		// if (!isValidToken) {
		// 	return error(400, 'invalid token');
		// }

		// // Grant admin privilege as event.locals.user is undefined
		// const grantedAdminPrivilegeAPI = api.grantAdminPrivilege();
		// // Update the password
		// const operationResult = await grantedAdminPrivilegeAPI.collection(slug).updateById({
		// 	id: userId,
		// 	data: {
		// 		password,
		// 		confirmPassword,
		// 		resetToken: '$argon2id' // <-- Clear the resetToken
		// 	}
		// });

		// if ('errors' in operationResult) {
		// 	return fail(500);
		// } else {
		// 	throw redirect(302, '/login');
		// }
	}
};
