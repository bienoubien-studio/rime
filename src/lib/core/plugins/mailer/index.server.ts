import { RimeError } from '$lib/core/errors/index.js';
import type { Plugin } from '$lib/core/types/plugins.js';
import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import type { SendMailArgs, SMTPConfig } from './types.js';

export const mailer: Plugin<SMTPConfig> = (smtpConfig) => {
	if (!smtpConfig) {
		throw new RimeError(RimeError.BAD_REQUEST, 'SMTP configuration is required');
	}

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
		} catch {
			throw new RimeError(RimeError.MAIL_ERROR, 'Error while sending mail');
		}
	};

	return {
		name: 'mailer',
		type: 'server',
		actions: {
			sendMail
		}
	};
};
