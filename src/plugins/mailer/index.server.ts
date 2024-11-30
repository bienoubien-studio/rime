import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import type { Plugin } from 'rizom/types/plugin';

export type SMTPConfig = {
	from: string | undefined;
	host: string | undefined;
	port: number | undefined;
	auth: {
		user: string | undefined;
		password: string | undefined;
	};
};

export const mailer: Plugin<SMTPConfig> = (smtpConfig) => {
	const { password, ...restAuth } = smtpConfig.auth;
	const options: SMTPTransport.Options = {
		secure: true,
		...smtpConfig,
		auth: {
			...restAuth,
			pass: password
		}
	};
	const mailer = nodemailer.createTransport(options);

	return {
		name: 'mailer',
		actions: {
			sendMail: mailer.sendMail
		}
	};
};

declare module 'rizom' {
	interface RegisterPluginsActions {
		mailer: {
			sendMail: (args: {
				from: string;
				to: string;
				subject: string;
				text: string;
				html: string;
			}) => Promise<any>;
		};
	}
}
