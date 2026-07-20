"use client";

import { Button } from "@package/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@package/ui/dialog";

interface ConfirmDeleteDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
	title?: string;
	description?: string;
	isLoading?: boolean;
}

export function ConfirmDeleteDialog({ open, onOpenChange, onConfirm, title = "Confirm Deletion", description = "Are you sure you want to delete this? This action cannot be undone.", isLoading = false }: ConfirmDeleteDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				<DialogFooter className="gap-2 sm:gap-0">
					<Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
						Cancel
					</Button>
					<Button variant="destructive" onClick={onConfirm} disabled={isLoading}>
						{isLoading ? "Deleting..." : "Delete"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
