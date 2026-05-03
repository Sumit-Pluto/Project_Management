import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().trim().min(3).max(120),
  description: z.string().trim().max(500).default("")
});

export const addMemberSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  role: z.enum(["admin", "member"]).default("member")
});
