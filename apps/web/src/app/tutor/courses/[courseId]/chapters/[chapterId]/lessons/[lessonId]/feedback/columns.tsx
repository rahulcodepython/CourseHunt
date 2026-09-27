"use client";

import { getFeedbackColumns } from "@/components/feedback/feedback-columns";
import type { Feedback } from "@/schema/feedbacks.types";

export const getColumns = (onDelete: (feedback: Feedback) => void) =>
  getFeedbackColumns({ onDelete });
