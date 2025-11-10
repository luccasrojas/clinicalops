import { useRouter } from "next/navigation";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { api } from "../../../../../convex/_generated/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AgentGetOne, CreateAgentFormValues } from "../../types";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createAgentSchema } from "@convexdev/zod/zodSchema";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import GeneratedAvatar from "@/components/generated-avatar";

interface AgentFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialValues?: AgentGetOne;
}

// basic functionality
// const schema = z.object({
//   name: z.string().min(2, "Name is required"),
//   nanoId: z.string().min(1),
//   instructions: z.string().min(5),
//   userId: z.string(),
// });

// type FormValues = z.infer<typeof schema>;

// type FormValues = z.infer<typeof api.agents.create>;

// type FormValues = Parameters<typeof api.agents.create>[0];

export const AgentForm = ({
  onSuccess,
  onCancel,
  initialValues,
}: AgentFormProps) => {
  const router = useRouter();

  const { mutate: createAgent, pending: createAgentPending } = useApiMutation(
    api.agents.create
  );

  const { mutate: updateAgent, pending: updateAgentPending } = useApiMutation(
    api.agents.update
  );

  const form = useForm<CreateAgentFormValues>({
    resolver: zodResolver(createAgentSchema),
    defaultValues: {
      name: initialValues?.name || "",
      instructions: initialValues?.instructions || "",
      artificial: true, // always true, no user input
    },
  });

  const isEdit = !!initialValues?.nanoId;
  const isPending = createAgentPending || updateAgentPending;

  const onSubmit = (values: CreateAgentFormValues) => {
    const payload = {
      ...values,
      artificial: true, // 👈 force default regardless of user input
    };

    // alert(JSON.stringify(values, null, 2));
    if (isEdit) {
      updateAgent({ ...payload, nanoId: initialValues.nanoId })
        .then(() => {
          toast.success("Paciente virtual actualizado");

          onSuccess?.(); // 👈 closes modal
        })
        .catch((error) => {
          toast.error("Error actualizando paciente virtual");
        });
    } else {
      // alert("Creating agent...");
      createAgent(payload)
        .then(() => {
          toast.success("Paciente virtual creado");
          onSuccess?.(); // 👈 closes modal
        })
        .catch((error: ConvexError<{ code: string; message: string }>) => {
          // // Skip client-side validation errors
          // if (
          //   err instanceof ConvexError &&
          //   err.data?.code === "VALIDATION_ERROR"
          // ) {
          //   console.warn("Convex validation error:", err);
          //   return Promise.reject(err);
          // }

          // // Otherwise show toast
          // toast.error(err?.message ?? "Ocurrió un error inesperado");
          // console.error(err);
          // throw err;
          // toast.error("Error creando paciente virtual");

          toast.error(error.data.message);

          // TODO: check if error code is FORBIDDEN, redirect to /upgrade
          if (error.data.code === "FORBIDDEN") {
            router.push("/dashboard/upgrade");
          }
        });
    }
  };

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(onSubmit, (errors) => {
          console.error(errors);
          // Dont show front end errors in toast!
          // toast.error("Algo salió mal al validar el formulario."); // or “Something went wrong validating the form.”
        })}
      >
        {/* Implement Generated Avatar */}
        <GeneratedAvatar
          variant="botttsNeutral"
          seed={form.watch("name")}
          className="border size-16"
        />
        <FormField
          name="name"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="ej., Paciente con dolor de cabeza"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="instructions"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instrucciones</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Eres un paciente que tiene dolor de cabeza y busca ayuda médica."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* 🌐 Global form-level message */}
        {(() => {
          const fieldNames = ["name", "instructions"];
          const globalErrors = Object.entries(form.formState.errors)
            .filter(([key]) => !fieldNames.includes(key))
            .map(([, err]) => err?.message)
            .filter(Boolean);

          if (globalErrors.length === 0) return null;

          return (
            <FormMessage>
              {/* {globalErrors.join(", ") ||
                "Algo salió mal al validar el formulario."} */}
              {"Algo salió mal al validar el formulario."}
            </FormMessage>
          );
        })()}

        <div className="flex justify-between gap-x-2">
          {onCancel && (
            <Button
              variant="ghost"
              disabled={isPending}
              type="button"
              onClick={() => onCancel()}
            >
              Cancel
            </Button>
          )}
          <Button variant={"accent"} disabled={isPending} type="submit">
            {isEdit ? "Guardar cambios" : "Crear"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
