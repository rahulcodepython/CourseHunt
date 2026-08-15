"use client";

import { apiRequest } from "@/react-query/client";

import { useAppQuery } from "@/react-query/query";
import { queryKeys } from "@/react-query/query-keys";
import { API_ENDPOINTS } from "@/lib/const";
import { AdminDashboardZod, TutorDashboardZod, UserDashboardZod } from "@/schema/dashboard.types";

export function useAdminDashboardQuery() {
	return useAppQuery(queryKeys.dashboardAdmin(), () =>
		apiRequest({ url: API_ENDPOINTS.DASHBOARD_ADMIN, method: "GET" }, AdminDashboardZod),
	);
}

export function useTutorDashboardQuery() {
	return useAppQuery(queryKeys.dashboardTutor(), () =>
		apiRequest({ url: API_ENDPOINTS.DASHBOARD_TUTOR, method: "GET" }, TutorDashboardZod),
	);
}

export function useUserDashboardQuery() {
	return useAppQuery(queryKeys.dashboardUser(), () =>
		apiRequest({ url: API_ENDPOINTS.DASHBOARD_USER, method: "GET" }, UserDashboardZod),
	);
}
