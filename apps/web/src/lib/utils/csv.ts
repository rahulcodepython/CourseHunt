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

// Every field is unconditionally quoted, and an embedded quote is doubled —
// both already RFC 4180 compliant. The one gap: RFC 4180 line endings are
// CRLF, and this codebase's rows were joined with a bare "\n". A parser
// that expects CRLF row separators has no unambiguous way to tell an
// embedded "\n" inside a quoted field apart from a real row break. `exceljs`
// (already used below for XLSX, and it could produce CSV too via
// `workbook.csv.writeBuffer()`) would fix this the same way — but that API
// is Promise-based, and these two functions are called synchronously from
// several components; switching them to async would ripple `await` into
// every call site, well outside a formatting-escaping fix. Using CRLF here
// closes the actual gap without that ripple.
function toCSVField(v: string | number): string {
  return `"${String(v).replace(/"/g, '""')}"`;
}

function toCSVContent(headers: string[], rows: (string | number)[][]): string {
  return [headers.map(toCSVField), ...rows.map((row) => row.map(toCSVField))]
    .map((fields) => fields.join(","))
    .join("\r\n");
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
  const csvContent = toCSVContent(headers, [row]);

  triggerDownload(
    new Blob([csvContent], { type: CSV_CONFIG.MIME_TYPE }),
    `${credentials.name.replace(/\s+/g, "_")}_credentials${CSV_CONFIG.EXTENSION}`,
  );
}

export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvContent = toCSVContent(headers, rows);

  triggerDownload(
    new Blob([csvContent], { type: CSV_CONFIG.MIME_TYPE }),
    filename.endsWith(CSV_CONFIG.EXTENSION) ? filename : `${filename}${CSV_CONFIG.EXTENSION}`,
  );
}

export async function exportToXLSX(
  filename: string,
  headers: string[],
  rows: (string | number)[][],
) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Sheet1");
  sheet.addRow(headers).font = { bold: true };
  rows.forEach((row) => sheet.addRow(row));
  sheet.columns.forEach((column) => {
    column.width = 20;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  triggerDownload(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`,
  );
}
