"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/form-dialog";
import { DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Icon } from "@/components/icon";
import { LoadingButton } from "@/components/loading-button";
import { exportToCSV, exportToXLSX } from "@/lib/csv";

type ExportFormat = "csv" | "xlsx";

/** Exports exactly what's currently rendered in a DataTable (visible columns, filtered + loaded rows) as CSV or XLSX. */
export function ExportTableButton({
    containerRef,
    filename,
}: {
    /** Ref on the element wrapping the rendered `<table>`. */
    containerRef: React.RefObject<HTMLElement | null>;
    filename: string;
}) {
    const [open, setOpen] = React.useState(false);
    const [format, setFormat] = React.useState<ExportFormat>("csv");
    const [isExporting, setIsExporting] = React.useState(false);

    const handleExport = async () => {
        const container = containerRef.current;
        if (!container) return;

        const headers = Array.from(container.querySelectorAll("thead th")).map(
            (th) => th.textContent?.trim() ?? "",
        );
        const rows = Array.from(container.querySelectorAll("tbody tr")).map((tr) =>
            Array.from(tr.querySelectorAll("td")).map((td) => td.textContent?.trim() ?? ""),
        );

        setIsExporting(true);
        try {
            if (format === "csv") {
                exportToCSV(filename, headers, rows);
            } else {
                await exportToXLSX(filename, headers, rows);
            }
            setOpen(false);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <>
            <Button variant="outline" size="sm" className="flex gap-2" onClick={() => setOpen(true)}>
                <Icon name="download" className="size-4" />
                <span>Export</span>
            </Button>
            <FormDialog
                open={open}
                onOpenChange={setOpen}
                title="Export Table"
                description="Choose a file format to download the currently displayed rows."
            >
                <RadioGroup value={format} onValueChange={(v) => setFormat(v as ExportFormat)} className="py-2">
                    <div className="flex items-center gap-2">
                        <RadioGroupItem value="csv" id="export-format-csv" />
                        <Label htmlFor="export-format-csv">CSV (.csv)</Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <RadioGroupItem value="xlsx" id="export-format-xlsx" />
                        <Label htmlFor="export-format-xlsx">Excel (.xlsx)</Label>
                    </div>
                </RadioGroup>
                <DialogFooter className="mt-2">
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={isExporting}>
                        Cancel
                    </Button>
                    <LoadingButton onClick={handleExport} loading={isExporting}>
                        Download
                    </LoadingButton>
                </DialogFooter>
            </FormDialog>
        </>
    );
}
