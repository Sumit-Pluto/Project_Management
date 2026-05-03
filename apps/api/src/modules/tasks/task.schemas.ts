import { z } from "zod";

const emptyToNull = (value: unknown) => (value === "" ? null : value);

export const createTaskSchema = z.object({
  title: z.string().trim().min(3).max(140),
  description: z.string().trim().max(800).default(""),
  status: z.enum(["todo", "in_progress", "done"]).default("todo"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  assigneeId: z.preprocess(emptyToNull, z.string().uuid().nullable().optional()),
  dueDate: z.preprocess(emptyToNull, z.string().date().nullable().optional())
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  status: z.enum(["todo", "in_progress", "done"]).optional()
});
