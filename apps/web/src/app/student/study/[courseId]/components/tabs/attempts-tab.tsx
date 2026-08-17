"use client";

import * as React from "react";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";

import { useQuizAttemptsQuery } from "@/query-hooks/quiz.api";
import type { QuizAttemptSummary } from "@/schema/quiz.types";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge, type StatusBadgeEntry } from "@/components/status-badge";
import { formatDateTime } from "@/lib/format";
import { QuizAttemptBreakdown } from "../quiz/quiz-attempt-breakdown";

const statusMap: Record<string, StatusBadgeEntry> = {
    passed: { label: "Passed", variant: "success" },
    failed: { label: "Not Passed", variant: "destructive" },
};

export function AttemptsTab({ quizId }: { quizId: string }) {
    const { data: raw, isLoading } = useQuizAttemptsQuery(quizId);
    const attempts = raw?.data ?? [];
    const [selectedAttemptId, setSelectedAttemptId] = React.useState<string | null>(null);

    const columnHelper = React.useMemo(() => createColumnHelper<QuizAttemptSummary>(), []);
    const columns: ColumnDef<QuizAttemptSummary, any>[] = React.useMemo(
        () => [
            columnHelper.accessor("submitted_at", {
                header: "Date",
                cell: ({ getValue }) => {
                    const value = getValue();
                    return <span className="text-muted-foreground">{value ? formatDateTime(value) : "In progress"}</span>;
                },
            }),
            columnHelper.accessor("total_score", {
                header: "Score",
                cell: ({ getValue }) => <span className="font-medium tabular-nums">{Math.round(getValue())}%</span>,
            }),
            columnHelper.accessor((row) => `${row.correct_count}/${row.correct_count + row.incorrect_count + row.skipped_count}`, {
                id: "correct",
                header: "Correct",
                cell: ({ getValue }) => <span className="text-muted-foreground tabular-nums">{getValue()}</span>,
            }),
            columnHelper.accessor("passed", {
                header: "Result",
                cell: ({ getValue }) => <StatusBadge status={getValue() ? "passed" : "failed"} map={statusMap} />,
            }),
            columnHelper.display({
                id: "actions",
                header: () => <div className="text-right">Actions</div>,
                cell: ({ row }) => (
                    <div className="flex justify-end">
                        <Button variant="outline" size="sm" onClick={() => setSelectedAttemptId(row.original.id)}>
                            View Breakdown
                        </Button>
                    </div>
                ),
            }),
        ],
        [columnHelper],
    );

    return (
        <>
            <DataTable
                columns={columns}
                data={attempts}
                showColumnToggle={false}
                emptyIcon="help-circle"
                emptyText="No attempts yet — take the quiz to see your results here."
                isLoading={isLoading}
                loadingText="Loading attempts..."
            />

            <Dialog open={!!selectedAttemptId} onOpenChange={(open) => !open && setSelectedAttemptId(null)}>
                <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Attempt Breakdown</DialogTitle>
                    </DialogHeader>
                    {selectedAttemptId && (
                        <QuizAttemptBreakdown attemptId={selectedAttemptId} onBack={() => setSelectedAttemptId(null)} />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
