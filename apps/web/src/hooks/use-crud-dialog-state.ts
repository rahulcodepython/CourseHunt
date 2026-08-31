"use client";

import * as React from "react";

/**
 * Shared create/edit/delete dialog state for list pages, replacing the
 * hand-rolled useState triplet (dialogOpen/editing/deleting) that used to be
 * copy-pasted across each *-client.tsx page.
 */
export function useCrudDialogState<T extends { id: string }>() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<T | null>(null);
  const [deleting, setDeleting] = React.useState<T | null>(null);

  const openCreate = React.useCallback(() => {
    setEditing(null);
    setDialogOpen(true);
  }, []);

  const openEdit = React.useCallback((item: T) => {
    setEditing(item);
    setDialogOpen(true);
  }, []);

  const requestDelete = React.useCallback((item: T) => {
    setDeleting(item);
  }, []);

  const confirmDelete = React.useCallback(
    async (deleteFn: (id: string) => Promise<unknown>) => {
      if (!deleting) return;
      await deleteFn(deleting.id);
      setDeleting(null);
    },
    [deleting],
  );

  return {
    dialogOpen,
    setDialogOpen,
    editing,
    openCreate,
    openEdit,
    deleting,
    setDeleting,
    requestDelete,
    confirmDelete,
  };
}
