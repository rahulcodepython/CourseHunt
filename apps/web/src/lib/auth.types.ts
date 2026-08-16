export interface RolesAndPermissionsResult {
    roles: string[];
    permissions: string[];
    hasCredentialAccount: boolean;
}

export interface AuthUser {
    id?: string;
    role?: string;
    banned?: boolean;
    passwordChangedAt?: Date | string | null;
}
