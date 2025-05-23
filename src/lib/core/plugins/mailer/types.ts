export type SendMailArgs = {
	to: string;
	subject: string;
	text: string;
	html?: string;
};
export type MailerActions = {
	sendMail: (args: SendMailArgs) => Promise<string>;
};

export type SMTPConfig = {
	from: string | undefined;
	host: string | undefined;
	port: number | undefined;
	auth: {
		user: string | undefined;
		password: string | undefined;
	};
};
