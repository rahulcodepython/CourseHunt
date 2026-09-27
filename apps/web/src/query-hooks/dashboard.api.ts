"use client";

import { useQuery } from "@tanstack/react-query";
import { request } from "@/react-query/client";

import { queryKeys } from "@/react-query/query-keys";
import { API_ENDPOINTS } from "@/lib/constants/const";
import { AdminDashboardZod, TutorDashboardZod, UserDashboardZod } from "@/schema/dashboard.types";

export function useAdminDashboardQuery() {
  return useQuery({ queryKey: queryKeys.dashboardAdmin(), queryFn: () =>
    request({ url: API_ENDPOINTS.DASHBOARD_ADMIN, method: "GET" }, AdminDashboardZod) });
}

export function useTutorDashboardQuery() {
  return useQuery({ queryKey: queryKeys.dashboardTutor(), queryFn: () =>
    request({ url: API_ENDPOINTS.DASHBOARD_TUTOR, method: "GET" }, TutorDashboardZod) });
}

export function useUserDashboardQuery() {
  return useQuery({ queryKey: queryKeys.dashboardUser(), queryFn: () =>
    request({ url: API_ENDPOINTS.DASHBOARD_USER, method: "GET" }, UserDashboardZod) });
}
