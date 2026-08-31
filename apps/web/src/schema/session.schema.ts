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
  [key: string]: any;
};

export interface SessionData {
  user: SessionUser;
  session: Record<string, unknown> | null;
}
