"use client";

import { getFaqColumns } from "@/components/faqs/faq-columns";
import type { Faq } from "@/schema/faqs.types";

export const getColumns = (onEdit: (faq: Faq) => void, onDelete: (faq: Faq) => void) =>
  getFaqColumns({ onEdit, onDelete });
