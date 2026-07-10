// =============================================================================
// Cache Update Strategies
// =============================================================================
// Declarative helpers for surgically patching cached data after a mutation
// succeeds, instead of invalidating (and refetching) the whole query. Pick
// the strategy that matches what the endpoint actually did:
//
//   cache.append(path?)          -> push the returned item onto an array cache
//   cache.prepend(path?)         -> unshift the returned item onto an array cache
//   cache.update(matcher, path?) -> merge a patch into the matching item
//   cache.remove(matcher, path?) -> drop the matching item
//   cache.replace()              -> swap the whole cache value (single-object caches)
//
// `path` is an optional dot-notation path to the array/object living inside
// the cached value — e.g. cache.append("feedbacks") for a cache shaped like
// { feedbacks: Feedback[] }. Omit it when the cache value *is* the array/object
// (e.g. a /profile endpoint cached as the raw object itself).
//
// These are pure (oldData, newData, variables) => nextData functions, so
// they work identically whether the underlying store is react-query's
// QueryClient or the Zustand cache store in store.ts.

/** Reads a nested value out of `obj` by dot-path. Returns `obj` unchanged if no path is given. */
function getAtPath(obj: any, path?: string) {
    if (!path) return obj;
    return path.split(".").reduce((acc, key) => acc?.[key], obj);
}

/**
 * Returns a new object/array with `value` set at `path`, cloning only the
 * segments along the way (shallow-immutable, safe for both react-query and
 * Zustand, which both rely on reference changes to trigger re-renders).
 * With no path, `value` itself becomes the new cache entry.
 */
function setAtPath(obj: any, path: string | undefined, value: any) {
    if (!path) return value;

    const keys = path.split(".");
    const root = Array.isArray(obj) ? [...obj] : { ...(obj ?? {}) };
    let cursor: any = root;

    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        cursor[key] = Array.isArray(cursor[key]) ? [...cursor[key]] : { ...(cursor[key] ?? {}) };
        cursor = cursor[key];
    }

    cursor[keys[keys.length - 1]] = value;
    return root;
}

/** Signature every cache strategy below produces; consumed by useApiMutation's `updateCache`. */
export type CacheUpdater<TData = any, TVariables = any> = (
    oldData: any,
    newData: TData,
    variables: TVariables,
) => any;

export const cache = {
    /** POST that returns the new item — append it to the end of a list cache. */
    append:
        <T = any>(path?: string): CacheUpdater<T> =>
            (old, newItem) => {
                const arr: T[] = getAtPath(old, path) ?? [];
                return setAtPath(old, path, [...arr, newItem]);
            },

    /** POST that returns the new item — prepend it (e.g. "newest first" feeds). */
    prepend:
        <T = any>(path?: string): CacheUpdater<T> =>
            (old, newItem) => {
                const arr: T[] = getAtPath(old, path) ?? [];
                return setAtPath(old, path, [newItem, ...arr]);
            },

    /**
     * PATCH that returns the updated item — merge it over the matching item
     * in a list cache. Falls back to `variables` when the API responds with
     * no body (e.g. `{ success: true }`-only endpoints), so you can still
     * patch optimistically from what you sent.
     *
     * Gotcha: the fallback only works cleanly when your PATCH body keys match
     * your schema keys 1:1. If they don't (e.g. body sends `pinned` but the
     * schema field is `isPinned`), write a 3-line custom updater inline
     * instead of relying on the fallback — see usage-examples.ts.
     */
    update:
        <T = any, TVariables = any>(
            matcher: (item: T, variables: TVariables) => boolean,
            path?: string,
        ): CacheUpdater<T, TVariables> =>
            (old, newData, variables) => {
                const arr: T[] = getAtPath(old, path) ?? [];
                return setAtPath(
                    old,
                    path,
                    arr.map((item) =>
                        matcher(item, variables) ? { ...item, ...(newData ?? variables) } : item,
                    ),
                );
            },

    /** DELETE — remove the matching item from a list cache. */
    remove:
        <T = any, TVariables = any>(
            matcher: (item: T, variables: TVariables) => boolean,
            path?: string,
        ): CacheUpdater<unknown, TVariables> =>
            (old, _newData, variables) => {
                const arr: T[] = getAtPath(old, path) ?? [];
                return setAtPath(
                    old,
                    path,
                    arr.filter((item) => !matcher(item, variables)),
                );
            },

    /** PATCH on a single-object cache (e.g. /profile) — swap in the whole response. */
    replace:
        <T = any>(): CacheUpdater<T> =>
            (_old, newData) =>
                newData,
};