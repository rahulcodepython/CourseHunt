"use client";

import { useQuery } from "@tanstack/react-query";
import { request, compactParams } from "@/react-query/client";
import { z } from "zod";

import { banUserAction, unbanUserAction } from "@/lib/actions/users";
import { useSimpleMutation, useObjectMutation } from "@/react-query/mutations";
import { queryKeys } from "@/react-query/query-keys";
import { API_ENDPOINTS } from "@/lib/constants/const";
import { PaginatedResponseZod } from "@/schema/common.types";
import {
  AssignRoleRequestZod,
  UserListResponseZod,
  RoleAssignmentResponseZod,
  UserProfileZod,
  TutorProfileZod,
  UpdateProfileRequestZod,
  AdminProfileItemZod,
} from "@/schema/users.types";

export function useUsersQuery(params?: Record<string, string | number>) {
  return useQuery({
    queryKey: queryKeys.users(params),
    queryFn: () =>
      request(
        { url: API_ENDPOINTS.USERS, method: "GET", params: compactParams(params) },
        PaginatedResponseZod(UserListResponseZod),
      ),
  });
}

export function useAssignRoleMutation(opts?: { showToast?: boolean }) {
  return useSimpleMutation({
    mutationFn: ({ id, data }: { id: string; data: z.infer<typeof AssignRoleRequestZod> }) =>
      request(
        { url: `${API_ENDPOINTS.USERS}/${id}/roles/assign`, method: "POST", data },
        RoleAssignmentResponseZod,
      ),
    invalidateKeys: [queryKeys.users()],
    silent: opts?.showToast === false,
  });
}

export function useRevokeRoleMutation() {
  return useSimpleMutation({
    mutationFn: ({ id, data }: { id: string; data: z.infer<typeof AssignRoleRequestZod> }) =>
      request(
        { url: `${API_ENDPOINTS.USERS}/${id}/roles/revoke`, method: "POST", data },
        RoleAssignmentResponseZod,
      ),
    invalidateKeys: [queryKeys.users()],
  });
}

export function useBanUserMutation() {
  return useSimpleMutation({
    mutationFn: (vars: { userId: string; banReason?: string }) =>
      banUserAction(vars.userId, vars.banReason),
    invalidateKeys: [queryKeys.users()],
  });
}

export function useUnbanUserMutation() {
  return useSimpleMutation({
    mutationFn: (vars: { userId: string }) => unbanUserAction(vars.userId),
    invalidateKeys: [queryKeys.users()],
  });
}

export function useCreateTutorProfileMutation() {
  return useObjectMutation({
    mutationFn: (data: z.infer<typeof UpdateProfileRequestZod>) =>
      request({ url: API_ENDPOINTS.PROFILE_TUTOR, method: "POST", data }, TutorProfileZod),
    queryKey: queryKeys.profileTutor(),
  });
}

export function useTutorProfileQuery() {
  return useQuery({
    queryKey: queryKeys.profileTutor(),
    queryFn: () => request({ url: API_ENDPOINTS.PROFILE_TUTOR, method: "GET" }, TutorProfileZod),
  });
}

export function useUserProfileQuery() {
  return useQuery({
    queryKey: queryKeys.profileUser(),
    queryFn: () => request({ url: API_ENDPOINTS.PROFILE_USER, method: "GET" }, UserProfileZod),
  });
}

export function useCreateUserProfileMutation() {
  return useObjectMutation({
    mutationFn: (data: z.infer<typeof UpdateProfileRequestZod>) =>
      request({ url: API_ENDPOINTS.PROFILE_USER, method: "POST", data }, UserProfileZod),
    queryKey: queryKeys.profileUser(),
  });
}

export function useAdminProfilesQuery(params?: Record<string, string | number>) {
  return useQuery({
    queryKey: queryKeys.profilesAdmin(params),
    queryFn: () =>
      request(
        { url: API_ENDPOINTS.PROFILE_ADMIN, method: "GET", params: compactParams(params) },
        PaginatedResponseZod(AdminProfileItemZod),
      ),
  });
}
