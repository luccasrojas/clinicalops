import z from "zod";

export const createTemplateSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  clinicalNoteExampleContent: z.string().min(0, "El contenido es requerido"),
  //   userId: z.string().min(1, "El ID de usuario es requerido"),
  //   public: z.boolean(), // Could share those schemas! Interesting...
});

export const updateTemplateSchema = createTemplateSchema.extend({
  nanoId: z.string().min(1, "El ID es requerido"),
});
