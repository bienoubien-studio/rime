import { error, json, type RequestEvent } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';
import type { BaseDoc, PrototypeSlug, User } from 'rizom/types';

export default function (slug: PrototypeSlug) {
	//
	async function POST(event: RequestEvent) {
		const { rizom, api } = event.locals;

		if (!rizom.mailer) {
			return error(400, 'missing smtp configuration');
		}

		const data = await event.request.json();
		const { email } = data;

		if (!email) {
			return error(400, { message: 'email missing' });
		}

		const [user] = await api.collection(slug).find<User & BaseDoc>({
			query: `where[email][equals]=${email}`
		});

		const token = await rizom.auth.createForgotPasswordToken(slug, user.id || null);

		if (user) {
			const link = `${env.PUBLIC_RIZOM_URL}/reset-password?token=${token}&slug=${slug}&id=${user.id}`;
			rizom.mailer
				.sendMail({
					from: rizom.mailer.options.from,
					to: user.email,
					subject: 'Reset Password',
					text: `You have request a password reset, please follow this link ${link}`,
					html: `<html><body><p>You have request a password reset, please follow this link ${link}</p></body></html>`
				})
				.then(() => {
					console.log('mail sent');
				})
				.catch((err: any) => {
					console.error(err);
					console.log(err.message);
				});
		}

		return json({ message: 'If user exist an email as been sent to : ' + email });
	}

	return POST;
}
