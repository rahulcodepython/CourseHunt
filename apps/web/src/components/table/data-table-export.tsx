"use client";

import * as React from "react";
import type { Table as TanStackTable } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/common/icon";
import { FormDialog } from "@/components/dialogs/form-dialog";
import { DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { LoadingButton } from "@/components/common/loading-button";
import { exportToCSV, exportToXLSX } from "@/lib/utils/csv";

export type ExportFormat = "csv" | "xlsx";

interface ExportTableButtonProps<TData> {
  table: TanStackTable<TData>;
  filename: string;
}

/** Exports displayed DataTable rows as CSV or XLSX using in-memory table data. */
export function ExportTableButton<TData>({
  table,
  filename,
}: ExportTableButtonProps<TData>) {
  const [open, setOpen] = React.useState(false);
  const [format, setFormat] = React.useState<ExportFormat>("csv");
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExport = async () => {
    const visibleColumns = table
      .getVisibleLeafColumns()
      .filter((col) => col.id !== "actions" && col.id !== "select");

    const headers = visibleColumns.map((col) => {
      const headerDef = col.columnDef.header;
      if (typeof headerDef === "string") return headerDef;
      return col.id;
    });

    const rows = table.getFilteredRowModel().rows.map((row) =>
      visibleColumns.map((col) => {
        const val = row.getValue(col.id);
        if (val === null || val === undefined) return "";
        if (typeof val === "object") {
          if ("name" in (val as any) && typeof (val as any).name === "string") return (val as any).name;
          if ("title" in (val as any) && typeof (val as any).title === "string") return (val as any).title;
          return JSON.stringify(val);
        }
        return String(val);
      }),
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
        <RadioGroup
          value={format}
          onValueChange={(v) => setFormat(v as ExportFormat)}
          className="py-2"
        >
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
