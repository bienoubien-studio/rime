import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import type { Plugin } from 'rizom';
import type { SendMailArgs, SMTPConfig } from './types';
import { json } from '@sveltejs/kit';

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
			await mailer.sendMail({ from: smtpConfig.from, ...args });
		} catch (err: any) {
			console.log(err);
		}
		return 'ok';
	};

	return {
		name: 'mailer',
		core: true,
		actions: {
			sendMail
		}
	};
};
