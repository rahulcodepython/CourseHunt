import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins";
import { Pool } from "pg";

const pool = new Pool({
	connectionString:
		process.env.DATABASE_URL ||
		"postgres://postgres:postgres@localhost:5432/coursehunt?sslmode=disable",
});

export const auth = betterAuth({
	database: pool,
	baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID || "",
			clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
		},
	},
	session: {
		expiresIn: 60 * 60 * 24 * 7, // 7 days (in seconds)
		updateAge: 60 * 60 * 24, // refresh session if older than 1 day
	},
	plugins: [
		jwt({
			jwks: {
				rotationInterval: 60 * 60 * 24 * 7, // 1 week
				gracePeriod: 60 * 60 * 24, // 1 day
			},
			jwt: {
				expirationTime: "1h",
				definePayload: async ({ user }) => {
					// Fetch roles assigned to this user
					const rolesResult = await pool.query<{ name: string }>(
						`SELECT r.name
						 FROM roles r
						 INNER JOIN user_roles ur ON ur.role_id = r.id
						 WHERE ur.user_id = $1`,
						[user.id]
					);
					const roles = rolesResult.rows.map((r) => r.name);

					// Fetch all permissions granted via any of the user's roles
					const permsResult = await pool.query<{ name: string }>(
						`SELECT DISTINCT p.name
						 FROM permissions p
						 INNER JOIN role_permissions rp ON rp.permission_id = p.id
						 INNER JOIN user_roles ur       ON ur.role_id       = rp.role_id
						 WHERE ur.user_id = $1`,
						[user.id]
					);
					const permissions = permsResult.rows.map((p) => p.name);

					return {
						user_id: user.id,
						email: user.email,
						roles,
						permissions,
					};
				},
			},
		}),
	],
});
