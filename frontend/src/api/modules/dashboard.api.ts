"use client";

import { apiRequest } from "@/api/client";

import { useApiQuery } from "@/api/core/generics";
import { queryKeys } from "@/api/query-keys";
import { AdminDashboardZod, TutorDashboardZod } from "@/types/dashboard.types";

import { UserDashboardZod } from "@/types/dashboard.types";

/**
 * Fetches admin dashboard data.
 */
export function useAdminDashboardQuery() {
	return useApiQuery(queryKeys.dashboardAdmin(), () =>
		apiRequest({ url: "/api/v1/dashboard/admin", method: "GET" }, AdminDashboardZod),
	);
}

/**
 * Fetches tutor dashboard data.
 */
export function useTutorDashboardQuery() {
	return useApiQuery(queryKeys.dashboardTutor(), () =>
		apiRequest({ url: "/api/v1/dashboard/tutor", method: "GET" }, TutorDashboardZod),
	);
}

/**
 * Fetches user dashboard data.
 */
export function useUserDashboardQuery() {
	return useApiQuery(queryKeys.dashboardUser(), () =>
		apiRequest({ url: "/api/v1/dashboard/user", method: "GET" }, UserDashboardZod),
	);
}
