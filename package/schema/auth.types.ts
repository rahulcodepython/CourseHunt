import { z } from "zod";

export const LoginRequestZod = z.object({
  email: z.string().email(),
  password: z.string(),
});
export type LoginRequest = z.infer<typeof LoginRequestZod>;

export const GoogleLoginRequestZod = z.object({
  idToken: z.string(),
});
export type GoogleLoginRequest = z.infer<typeof GoogleLoginRequestZod>;

export const ChangePasswordRequestZod = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});
export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestZod>;

export const UserZod = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  image: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  banned: z.boolean(),
  passwordChangedAt: z.string().nullable().optional(),
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
});
export type User = z.infer<typeof UserZod>;

export const TokenResponseZod = z.object({
  accessToken: z.string(),
  user: UserZod,
});
export type TokenResponse = z.infer<typeof TokenResponseZod>;

export const CreateUserRequestZod = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["admin", "tutor"]),
});
export type CreateUserRequest = z.infer<typeof CreateUserRequestZod>;

export const CreateUserResponseZod = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.string(),
});
export type CreateUserResponse = z.infer<typeof CreateUserResponseZod>;

export const SessionZod = z.object({
  id: z.string(),
  user_id: z.string(),
  refresh_token_hash: z.string(),
  expires_at: z.string(),
  created_at: z.string(),
});
export type Session = z.infer<typeof SessionZod>;
