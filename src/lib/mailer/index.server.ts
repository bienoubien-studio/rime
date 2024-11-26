import nodemailer, { type Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { hasProps } from '../utils/object';
import type { Config, SMTPConfig } from 'rizom/types/config';

export const createMailerInterface = (incomingConfig: Config) => {
	let mailer: Transporter<SMTPTransport.SentMessageInfo> | undefined;
	let smtpConfig: SMTPConfig | undefined;

	const init = (config: Config) => {
		if (hasProps(config, ['smtp'])) {
			if (JSON.stringify(config.smtp) !== JSON.stringify(smtpConfig)) {
				const { password, ...restAuth } = config.smtp.auth;
				const options: SMTPTransport.Options = {
					secure: true,
					...config.smtp,
					auth: {
						...restAuth,
						pass: password
					}
				};
				mailer = nodemailer.createTransport(options);
				smtpConfig = config.smtp;
			}
		}
	};

	init(incomingConfig);

	return {
		init,
		get mailer() {
			return mailer;
		}
	};
};
