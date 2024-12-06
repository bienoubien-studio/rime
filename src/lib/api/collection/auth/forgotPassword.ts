import { error, json, type RequestEvent } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';
import type { BaseDoc, CollectionSlug } from 'rizom/types';
import type { MailerPlugin } from 'rizom/types/plugin';

export default function (slug: CollectionSlug) {
	//
	async function POST(event: RequestEvent) {
		const { rizom, api } = event.locals;

		if (!('mailer' in rizom.plugins)) {
			return error(404);
		}

		const mailer = rizom.plugins.mailer as MailerPlugin;
		const sendMail = mailer.sendMail;
		const from = mailer.options.from;

		const data = await event.request.json();
		const { email } = data;

		if (!email) {
			return error(400, { message: 'email missing' });
		}

		const [user] = (await api.collection(slug).find({
			query: `where[email][equals]=${email}`
		})) as Array<BaseDoc & { email: string }>;

		const token = await rizom.auth.createForgotPasswordToken(slug, user.id || null);

		if (user) {
			const link = `${env.PUBLIC_RIZOM_URL}/reset-password?token=${token}&slug=${slug}&id=${user.id}`;
			sendMail({
				from,
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
