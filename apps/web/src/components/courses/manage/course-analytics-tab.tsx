"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loading } from "@/components/common/loading";
import { formatINR } from "@/lib/utils/format";
import type { DailySalesPoint, MonthlySalesPoint } from "@/schema/courses.types";

interface CourseAnalyticsTabProps {
  isLoading: boolean;
  dailySales: DailySalesPoint[];
  monthlySales: MonthlySalesPoint[];
}

export function CourseAnalyticsTab({
  isLoading,
  dailySales,
  monthlySales,
}: CourseAnalyticsTabProps) {
  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <CardTitle>Sales Analytics</CardTitle>
          <CardDescription>Real-time revenue performance from verified student purchases</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-72 items-center justify-center">
            <Loading className="min-h-0" />
          </div>
        ) : (
          <Tabs defaultValue="monthly" className="space-y-4">
            <TabsList className="inline-flex w-fit h-auto p-1 bg-muted/60 rounded-lg">
              <TabsTrigger value="monthly">Monthly Sales</TabsTrigger>
              <TabsTrigger value="daily">Daily Sales</TabsTrigger>
            </TabsList>

            <TabsContent value="monthly" className="space-y-2">
              <div className="flex items-baseline justify-between text-xs text-muted-foreground px-1">
                <span>Last 6 Months</span>
                <span className="font-medium text-foreground">
                  Total: {formatINR(monthlySales.reduce((acc, curr) => acc + curr.revenue, 0))} ({monthlySales.reduce((acc, curr) => acc + curr.count, 0)} sales)
                </span>
              </div>
              <div className="h-[320px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlySales} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="monthlySalesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.7} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" vertical={false} />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      axisLine={{ stroke: "rgba(148, 163, 184, 0.3)" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => `₹${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card, #ffffff)",
                        borderColor: "var(--border, #e2e8f0)",
                        color: "var(--foreground, #0f172a)",
                        borderRadius: "8px",
                        fontSize: "12px",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                      }}
                      formatter={(value) => [
                        `₹${Number(value ?? 0).toLocaleString("en-IN")}`,
                        "Revenue",
                      ]}
                      labelFormatter={(label, payload) => {
                        const item = payload?.[0]?.payload;
                        return item ? `${item.month} (${item.year_month}) - ${item.count} orders` : label;
                      }}
                      cursor={{ fill: "rgba(148, 163, 184, 0.1)" }}
                    />
                    <Bar dataKey="revenue" fill="url(#monthlySalesGradient)" radius={[6, 6, 0, 0]} maxBarSize={60} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="daily" className="space-y-2">
              <div className="flex items-baseline justify-between text-xs text-muted-foreground px-1">
                <span>Last 7 Days</span>
                <span className="font-medium text-foreground">
                  Total: {formatINR(dailySales.reduce((acc, curr) => acc + curr.revenue, 0))} ({dailySales.reduce((acc, curr) => acc + curr.count, 0)} sales)
                </span>
              </div>
              <div className="h-[320px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailySales} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="dailySalesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#047857" stopOpacity={0.7} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" vertical={false} />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      axisLine={{ stroke: "rgba(148, 163, 184, 0.3)" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => `₹${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card, #ffffff)",
                        borderColor: "var(--border, #e2e8f0)",
                        color: "var(--foreground, #0f172a)",
                        borderRadius: "8px",
                        fontSize: "12px",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                      }}
                      formatter={(value) => [
                        `₹${Number(value ?? 0).toLocaleString("en-IN")}`,
                        "Revenue",
                      ]}
                      labelFormatter={(label, payload) => {
                        const item = payload?.[0]?.payload;
                        return item ? `${item.day}, ${item.date} - ${item.count} orders` : label;
                      }}
                      cursor={{ fill: "rgba(148, 163, 184, 0.1)" }}
                    />
                    <Bar dataKey="revenue" fill="url(#dailySalesGradient)" radius={[6, 6, 0, 0]} maxBarSize={60} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
