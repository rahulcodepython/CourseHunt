// Merges a freshly-fetched page of paginated items into an accumulated
// "Load More" list: existing entries are updated in place (edits, count
// changes), new ones are appended at the end — never reordered, never
// duplicated. Shared by every accumulate-and-merge feed in the app
// (discussions/replies, notifications, logs, security events).
export function mergeListPage<T extends { id: string | number }>(prev: T[], incoming: T[]): T[] {
    const next = [...prev];
    const indexById = new Map(next.map((item, idx) => [item.id, idx] as const));
    for (const item of incoming) {
        const existingIdx = indexById.get(item.id);
        if (existingIdx !== undefined) {
            next[existingIdx] = item;
        } else {
            indexById.set(item.id, next.length);
            next.push(item);
        }
    }
    return next;
}
