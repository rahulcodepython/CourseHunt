export interface RolesAndPermissionsResult {
    roles: string[];
    permissions: string[];
}

export interface AuthUser {
    id?: string;
    role?: string;
    banned?: boolean;
    passwordChangedAt?: Date | string | null;
}
