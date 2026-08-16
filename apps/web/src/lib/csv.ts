import ExcelJS from "exceljs";
import { CSV_CONFIG } from "@/lib/const";

function triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

export function downloadCredentialsCSV(
    credentials: { name: string; email: string; password: string; role: string },
    platformUrl: string,
) {
    const headers = [...CSV_CONFIG.CREDENTIALS_HEADERS];
    const row = [
        credentials.name,
        credentials.email,
        credentials.password,
        credentials.role,
        platformUrl,
    ];
    const csvContent = [
        headers.join(","),
        row.map((v) => `"${v.replace(/"/g, '""')}"`).join(","),
    ].join("\n");

    triggerDownload(
        new Blob([csvContent], { type: CSV_CONFIG.MIME_TYPE }),
        `${credentials.name.replace(/\s+/g, "_")}_credentials${CSV_CONFIG.EXTENSION}`,
    );
}

export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
    const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    triggerDownload(
        new Blob([csvContent], { type: CSV_CONFIG.MIME_TYPE }),
        filename.endsWith(CSV_CONFIG.EXTENSION) ? filename : `${filename}${CSV_CONFIG.EXTENSION}`,
    );
}

export async function exportToXLSX(filename: string, headers: string[], rows: (string | number)[][]) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Sheet1");
    sheet.addRow(headers).font = { bold: true };
    rows.forEach((row) => sheet.addRow(row));
    sheet.columns.forEach((column) => {
        column.width = 20;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    triggerDownload(
        new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
        filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`,
    );
}
