import { CSV_CONFIG } from "@/lib/const";

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

    const blob = new Blob([csvContent], { type: CSV_CONFIG.MIME_TYPE });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${credentials.name.replace(/\s+/g, "_")}_credentials${CSV_CONFIG.EXTENSION}`;
    link.click();
    URL.revokeObjectURL(url);
}

export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
    const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: CSV_CONFIG.MIME_TYPE });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename.endsWith(CSV_CONFIG.EXTENSION) ? filename : `${filename}${CSV_CONFIG.EXTENSION}`;
    link.click();
    URL.revokeObjectURL(url);
}
