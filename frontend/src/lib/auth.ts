import { betterAuth } from "better-auth";
import { admin, jwt } from "better-auth/plugins";
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
	user: {
		additionalFields: {
			position: {
				type: "string", // Use string to support custom roles
				defaultValue: "student", // Default role: "student", "tutor", or "admin"
				input: true, // Allow passing during creation
			},
		},
	},
	session: {
		expiresIn: 60 * 60 * 24 * 7, // 7 days (in seconds)
		updateAge: 60 * 60 * 24, // refresh session if older than 1 day
	},
	plugins: [
		admin(),
		jwt({
			jwks: {
				rotationInterval: 60 * 60 * 24 * 7, // 1 week
				gracePeriod: 60 * 60 * 24, // 1 day
			},
			jwt: {
				expirationTime: "1h",
			},
		}),
	],
});
