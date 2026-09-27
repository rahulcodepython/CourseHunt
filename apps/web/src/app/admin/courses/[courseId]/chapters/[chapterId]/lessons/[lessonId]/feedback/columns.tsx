"use client";

import { getFeedbackColumns } from "@/components/feedback/feedback-columns";
import type { Feedback } from "@/schema/feedbacks.types";

export const getColumns = (
  onPinToggle: (feedback: Feedback) => void,
  onDelete: (feedback: Feedback) => void,
) => getFeedbackColumns({ onPinToggle, onDelete });
