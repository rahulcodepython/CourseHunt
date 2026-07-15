"use client";

import { apiRequest } from "@/api/client";

import { useApiQuery } from "@/api/core/generics";
import { queryKeys } from "@/api/query-keys";
import { AdminDashboardZod, TutorDashboardZod, UserDashboardZod } from "@/types/dashboard.types";

export function useAdminDashboardQuery() {
	return useApiQuery(queryKeys.dashboardAdmin(), () =>
		apiRequest({ url: "/api/v1/dashboard/admin", method: "GET" }, AdminDashboardZod),
	);
}

export function useTutorDashboardQuery() {
	return useApiQuery(queryKeys.dashboardTutor(), () =>
		apiRequest({ url: "/api/v1/dashboard/tutor", method: "GET" }, TutorDashboardZod),
	);
}

export function useUserDashboardQuery() {
	return useApiQuery(queryKeys.dashboardUser(), () =>
		apiRequest({ url: "/api/v1/dashboard/user", method: "GET" }, UserDashboardZod),
	);
}
