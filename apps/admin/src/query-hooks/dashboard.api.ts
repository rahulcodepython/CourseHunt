"use client";

import { apiRequest } from "@package/react-query/client";

import { useAppQuery } from "@package/react-query/query";
import { queryKeys } from "@package/react-query/query-keys";
import { AdminDashboardZod, TutorDashboardZod, UserDashboardZod } from "@package/schema/dashboard.types";

export function useAdminDashboardQuery() {
	return useAppQuery(queryKeys.dashboardAdmin(), () =>
		apiRequest({ url: "/api/v1/dashboard/admin", method: "GET" }, AdminDashboardZod),
	);
}

export function useTutorDashboardQuery() {
	return useAppQuery(queryKeys.dashboardTutor(), () =>
		apiRequest({ url: "/api/v1/dashboard/tutor", method: "GET" }, TutorDashboardZod),
	);
}

export function useUserDashboardQuery() {
	return useAppQuery(queryKeys.dashboardUser(), () =>
		apiRequest({ url: "/api/v1/dashboard/user", method: "GET" }, UserDashboardZod),
	);
}
