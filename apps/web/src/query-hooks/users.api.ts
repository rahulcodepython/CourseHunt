"use client";

import { apiRequest } from "@/react-query/client";
import { z } from "zod";

import { banUserAction, unbanUserAction } from "@/lib/actions/users";
import { useSimpleMutation, useObjectMutation } from "@/react-query/mutation";
import { useAppQuery } from "@/react-query/query";
import { createListQuery } from "@/react-query/query-factories";
import { queryKeys } from "@/react-query/query-keys";
import { API_ENDPOINTS } from "@/lib/const";
import {
  AssignRoleRequestZod,
  UserListResponseZod,
  RoleAssignmentResponseZod,
  UserProfileZod,
  TutorProfileZod,
  UpdateProfileRequestZod,
  AdminProfileItemZod,
} from "@/schema/users.types";

export const useUsersQuery = createListQuery(
  API_ENDPOINTS.USERS,
  queryKeys.users,
  UserListResponseZod,
);

export function useAssignRoleMutation(opts?: { showToast?: boolean }) {
  return useSimpleMutation({
    mutationFn: ({ id, data }: { id: string; data: z.infer<typeof AssignRoleRequestZod> }) =>
      apiRequest(
        { url: `${API_ENDPOINTS.USERS}/${id}/roles/assign`, method: "POST", data },
        RoleAssignmentResponseZod,
      ),
    invalidateKeys: [queryKeys.users()],
    showToast: opts?.showToast ?? true,
  });
}

export function useRevokeRoleMutation() {
  return useSimpleMutation({
    mutationFn: ({ id, data }: { id: string; data: z.infer<typeof AssignRoleRequestZod> }) =>
      apiRequest(
        { url: `${API_ENDPOINTS.USERS}/${id}/roles/revoke`, method: "POST", data },
        RoleAssignmentResponseZod,
      ),
    invalidateKeys: [queryKeys.users()],
    showToast: true,
  });
}

export function useBanUserMutation() {
  return useSimpleMutation({
    mutationFn: (vars: { userId: string; banReason?: string }) =>
      banUserAction(vars.userId, vars.banReason),
    invalidateKeys: [queryKeys.users()],
    showToast: true,
  });
}

export function useUnbanUserMutation() {
  return useSimpleMutation({
    mutationFn: (vars: { userId: string }) => unbanUserAction(vars.userId),
    invalidateKeys: [queryKeys.users()],
    showToast: true,
  });
}

export function useCreateTutorProfileMutation() {
  return useObjectMutation({
    mutationFn: (data: z.infer<typeof UpdateProfileRequestZod>) =>
      apiRequest({ url: API_ENDPOINTS.PROFILE_TUTOR, method: "POST", data }, TutorProfileZod),
    queryKey: queryKeys.profileTutor(),
    showToast: true,
  });
}

export function useTutorProfileQuery() {
  return useAppQuery(queryKeys.profileTutor(), () =>
    apiRequest({ url: API_ENDPOINTS.PROFILE_TUTOR, method: "GET" }, TutorProfileZod),
  );
}

export function useUserProfileQuery() {
  return useAppQuery(queryKeys.profileUser(), () =>
    apiRequest({ url: API_ENDPOINTS.PROFILE_USER, method: "GET" }, UserProfileZod),
  );
}

export function useCreateUserProfileMutation() {
  return useObjectMutation({
    mutationFn: (data: z.infer<typeof UpdateProfileRequestZod>) =>
      apiRequest({ url: API_ENDPOINTS.PROFILE_USER, method: "POST", data }, UserProfileZod),
    queryKey: queryKeys.profileUser(),
    showToast: true,
  });
}

export const useAdminProfilesQuery = createListQuery(
  API_ENDPOINTS.PROFILE_ADMIN,
  queryKeys.profilesAdmin,
  AdminProfileItemZod,
);
