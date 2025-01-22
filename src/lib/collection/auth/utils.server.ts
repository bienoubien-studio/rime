// import { Argon2id } from 'oslo/password';

// const getEnvSecret = () => {
// 	if (!process.env.RIZOM_SECRET) {
// 		throw new Error('No process.env.RIZOM_SECRET provided');
// 		process.exit();
// 	}
// 	return process.env.RIZOM_SECRET;
// };

// const SECRET = getEnvSecret();

// const argon2id = new Argon2id({
// 	secret: Buffer.from(SECRET)
// });

// async function hash(str: string): Promise<string> {
// 	const hashed = await argon2id.hash(str);
// 	return new Promise((resolve) => resolve(hashed));
// }

// const verifyHash = async ({ hash, clear }: VerifyHashArgs) => {
// 	const isValid = await argon2id.verify(hash, clear);
// 	return isValid;
// };

// export { hash, verifyHash };

// type VerifyHashArgs = { hash: string; clear: string };
