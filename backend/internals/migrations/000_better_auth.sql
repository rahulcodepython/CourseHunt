-- 000: Better-Auth tables (pre-existing from better-auth library)
CREATE TABLE IF NOT EXISTS "user" (
    "id"            text not null primary key,
    "name"          text not null,
    "email"         text not null unique,
    "emailVerified" boolean not null default false,
    "image"         text,
    "createdAt"     timestamptz default CURRENT_TIMESTAMP not null,
    "updatedAt"     timestamptz default CURRENT_TIMESTAMP not null,
    "banned"        boolean default false,
    "banReason"     text,
    "banExpires"    timestamptz
);

CREATE TABLE IF NOT EXISTS "session" (
    "id"             text not null primary key,
    "expiresAt"      timestamptz not null,
    "token"          text not null unique,
    "createdAt"      timestamptz default CURRENT_TIMESTAMP not null,
    "updatedAt"      timestamptz default CURRENT_TIMESTAMP not null,
    "ipAddress"      text,
    "userAgent"      text,
    "userId"         text not null references "user" ("id") on delete cascade,
    "impersonatedBy" text
);

CREATE TABLE IF NOT EXISTS "account" (
    "id"                    text not null primary key,
    "accountId"             text not null,
    "providerId"            text not null,
    "userId"                text not null references "user" ("id") on delete cascade,
    "accessToken"           text,
    "refreshToken"          text,
    "idToken"               text,
    "accessTokenExpiresAt"  timestamptz,
    "refreshTokenExpiresAt" timestamptz,
    "scope"                 text,
    "password"              text,
    "createdAt"             timestamptz default CURRENT_TIMESTAMP not null,
    "updatedAt"             timestamptz default CURRENT_TIMESTAMP not null
);

CREATE TABLE IF NOT EXISTS "verification" (
    "id"         text not null primary key,
    "identifier" text not null,
    "value"      text not null,
    "expiresAt"  timestamptz not null,
    "createdAt"  timestamptz default CURRENT_TIMESTAMP not null,
    "updatedAt"  timestamptz default CURRENT_TIMESTAMP not null
);

CREATE TABLE IF NOT EXISTS "jwks" (
    "id"        text not null primary key,
    "publicKey" text not null,
    "privateKey" text not null,
    "createdAt" timestamptz not null,
    "expiresAt" timestamptz
);

CREATE INDEX IF NOT EXISTS "session_userId_idx"          ON "session" ("userId");
CREATE INDEX IF NOT EXISTS "account_userId_idx"          ON "account" ("userId");
CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification" ("identifier");


CREATE INDEX IF NOT EXISTS idx_user_name ON "user"(name);
CREATE INDEX IF NOT EXISTS idx_user_email ON "user"(email);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);