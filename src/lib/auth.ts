// import { betterAuth } from 'better-auth';
// import Database from 'better-sqlite3';
// import { drizzleAdapter } from 'better-auth/adapters/drizzle';
// import { drizzle } from 'drizzle-orm/better-sqlite3';
// import schema from './server/schema.js';

// const sqlite = new Database(`./db/rizom.sqlite`);
// const db = drizzle(sqlite, { schema });

// export const auth = betterAuth({
// 	database: drizzleAdapter(db, {
// 		provider: 'sqlite',
// 		schema: {
// 			...schema,
// 			user: schema.authUsers,
// 			session: schema.sessions,
// 			account: schema.accounts,
// 			verification: schema.verifications,
// 		}
// 	}),
// 	emailAndPassword: {
// 		enabled: true
// 	}
// });
