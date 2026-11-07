import { z } from "zod";

export const CreateProjectSchema = z
  .object({
    title: z.string().min(1).max(200),
    description: z.string().min(1).max(5000),
    userId: z.string().uuid(),
  })
  .strict();

export const UpdateProjectSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().min(1).max(5000).optional(),
    status: z
      .enum(["draft", "researching", "clarifying", "deciding", "generating", "reviewing", "approved", "archived"])
      .optional(),
  })
  .strict();

export const ProjectIdSchema = z.object({
  id: z.string().uuid(),
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
export type ProjectIdInput = z.infer<typeof ProjectIdSchema>;
