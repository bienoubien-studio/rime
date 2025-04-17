import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import type { Plugin } from '$lib/plugins/index.js';
import type { SendMailArgs, SMTPConfig } from './types';
import { RizomError } from '$lib/errors';

export const mailer: Plugin<SMTPConfig> = (smtpConfig: SMTPConfig) => {
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

	const sendMail = async (args: SendMailArgs) => {
		try {
			return await mailer.sendMail({ from: smtpConfig.from, ...args });
		} catch (err: any) {
			throw new RizomError(RizomError.MAIL_ERROR, 'Error while sending mail');
		}
	};

	return {
		name: 'mailer',
		core: true,
		actions: {
			sendMail
		}
	};
};
