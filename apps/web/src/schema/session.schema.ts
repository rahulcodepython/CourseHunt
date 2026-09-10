export type SessionUser = {
  id: string;
  name: string;
  email: string;
  emailVerified?: boolean;
  image?: string | null;
  role?: string | null;
  banned?: boolean | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  permissions?: string[];
  passwordChangedAt?: string | Date | null;
};

export interface SessionRecord {
  id: string;
  userId: string;
  expiresAt: Date | string;
  token: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface SessionData {
  user: SessionUser;
  session: SessionRecord | null;
}
