import { createAuthClient } from "better-auth/react";
import { jwtClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    plugins: [
        jwtClient(),
    ],
});

export const { signIn, signOut, signUp, useSession } = authClient;

export const signInWithEmail = async (email: string, password: string, callbackURL?: string) => {
    return authClient.signIn.email({ email, password, callbackURL });
};
