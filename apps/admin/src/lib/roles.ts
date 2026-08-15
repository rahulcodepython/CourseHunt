type RoleItem = { name: string } | string;

/** A user's primary role name, preferring the better-auth `role` field and falling back to the first custom role. */
export function getPrimaryRole(user: { role?: string | null; roles?: RoleItem[] | null }): string | undefined {
    if (user.role) return user.role;
    const first = user.roles?.[0];
    if (first == null) return undefined;
    return typeof first === "string" ? first : first.name;
}
