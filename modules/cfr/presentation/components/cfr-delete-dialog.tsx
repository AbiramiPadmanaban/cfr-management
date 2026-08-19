"use client";

import { useState } from "react";


export interface CfrDeleteDialogProps {
  id: number;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function CfrDeleteDialog({ id, onConfirm, onCancel }: CfrDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    setIsDeleting(true);
    setError("");
    try {
      await onConfirm();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete";
      setError(msg);
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-700 border border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900">
          {error}
        </div>
      )}

      <div className="text-zinc-700 dark:text-zinc-300">
        <p className="font-semibold text-zinc-900 dark:text-zinc-50">
          Are you sure you want to delete this CFR?
        </p>
        <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
          This will permanently remove Customer Feedback Review record <span className="font-semibold text-zinc-800 dark:text-zinc-200">#{id}</span> from the database. This action cannot be undone.
        </p>
      </div>

      <div className="flex justify-end gap-3 border-t border-zinc-150 pt-4 dark:border-zinc-800">
        <button
          type="button"
          onClick={onCancel}
          disabled={isDeleting}
          className="rounded-lg border border-zinc-250 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-850"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isDeleting}
          className="rounded-lg bg-red-650 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 focus:outline-none dark:bg-red-600 dark:hover:bg-red-500"
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </div>
  );
}
