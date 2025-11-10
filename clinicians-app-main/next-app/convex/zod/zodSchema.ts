import { z } from "zod";
import { v, type Validator, type Infer } from "convex/values";

export const createMeetingSchema = z.object({
  name: z.string().min(2, "Nombre es requerido"),
  // nanoId: z.string().min(1, "Nano ID es requerido"),
  agentNanoId: z.string().min(5, "Paciente es requerido"),
  simulation: z.boolean(),
});

export const updateMeetingSchema = createMeetingSchema.extend({
  nanoId: z.string().min(1, "ID es requerido"),
});

// should probably rely on this for agents.ts
export const createAgentSchema = z.object({
  name: z.string().min(2, "Nombre es requerido"),
  // nanoId: z.string().min(1, "Nano ID es requerido"),
  instructions: z.string().min(5, "Instrucciones son muy cortas"),
  artificial: z.boolean(),
});

export const updateAgentSchema = createAgentSchema.extend({
  nanoId: z.string().min(1, "ID es requerido"),
});

//https://github.com/get-convex/convex-helpers/blob/main/packages/convex-helpers/server/zod.ts
// https://chatgpt.com/c/68e24df7-9954-8322-b1d0-e4bc8b1e4096

// helper: convert Zod to Convex at runtime
function zodToConvexRuntime(schema: z.ZodTypeAny): Validator<any, any, any> {
  // Handle both Zod v3 (_def) and v4 (def) structures
  const def = (schema as any)._def || (schema as any).def;

  if (!def) {
    throw new Error(
      `Invalid Zod schema: missing _def or def. Schema: ${JSON.stringify(
        schema
      )}`
    );
  }

  // Handle both typeName (v3) and type (v4)
  const typeName = def.typeName || def.type;

  if (!typeName) {
    throw new Error(
      `Invalid Zod schema: missing typeName or type. Available properties: ${Object.keys(
        def
      ).join(", ")}`
    );
  }

  switch (typeName) {
    case "ZodString":
    case "string":
      return v.string();
    case "ZodNumber":
    case "number":
      return v.number();
    case "ZodBoolean":
    case "boolean":
      return v.boolean();
    case "ZodNull":
    case "null":
      return v.null();
    case "ZodArray":
    case "array":
      return v.array(zodToConvexRuntime(def.type || def.element));
    case "ZodObject":
    case "object": {
      // Handle both v3 (shape()) and v4 (shape) structures
      const shape = typeof def.shape === "function" ? def.shape() : def.shape;
      const fields = Object.fromEntries(
        Object.entries(shape).map(([k, s]) => [
          k,
          zodToConvexRuntime(s as z.ZodTypeAny),
        ])
      );
      return v.object(fields);
    }
    case "ZodOptional":
    case "optional":
      return v.optional(
        zodToConvexRuntime((schema as z.ZodOptional<any>).unwrap())
      );
    case "ZodNullable":
    case "nullable":
      return v.union(
        zodToConvexRuntime((schema as z.ZodNullable<any>).unwrap()),
        v.null()
      );
    case "ZodUnion":
    case "union":
      return v.union(
        ...def.options.map((s: z.ZodTypeAny) => zodToConvexRuntime(s))
      );
    case "ZodLiteral":
    case "literal":
      return v.literal(def.value);
    case "ZodEnum":
    case "enum":
      return v.union(...def.values.map((val: string) => v.literal(val)));
    default:
      throw new Error(
        `Unsupported Zod type: ${typeName}. Available properties: ${Object.keys(
          def
        ).join(", ")}`
      );
  }
}

/**
 * Strongly-typed wrapper preserving inference.
 */
export function zodToConvex<T extends z.ZodTypeAny>(
  schema: T
): Validator<z.infer<T>> {
  return zodToConvexRuntime(schema) as Validator<z.infer<T>>;
}
