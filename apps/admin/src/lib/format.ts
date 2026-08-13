export function formatINR(value: number): string {
  return "₹" + value.toLocaleString("en-IN");
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function truncate(value: string, length: number): string {
  if (value.length <= length) return value;
  return value.slice(0, length) + "…";
}
