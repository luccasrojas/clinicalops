import { useRouter } from "next/navigation";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { api } from "../../../../../convex/_generated/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MeetingGetOne, CreateMeetingFormValues } from "../../types";
import { Doc } from "@/../convex/_generated/dataModel";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createMeetingSchema } from "@convexdev/zod/zodSchema";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import { useQuery } from "convex/react";
import { useState } from "react";

import { CommandSelect } from "@/components/command-select";
import GeneratedAvatar from "@/components/generated-avatar";
import { NewAgentDialog } from "@/modules/agents/ui/components/new-agent-dialog";
import AudioUploaderPRARTIS from "@/components/audio-uploader";
import { Loader2Icon } from "lucide-react";

interface MeetingFormProps {
  onSuccess?: (id?: string) => void;
  onCancel?: () => void;
  initialValues?: MeetingGetOne;
  isSimulation?: boolean;
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

export const MeetingForm = ({
  onSuccess,
  onCancel,
  initialValues,
  isSimulation = true,
}: MeetingFormProps) => {
  const router = useRouter();

  const [openNewAgentDialog, setOpenNewAgentDialog] = useState(false);
  const [agentSearch, setAgentSearch] = useState("");

  const agentsData = useQuery(api.agents.getMany, {
    pageSize: 100, // fetch up to 100 agents for the dropdown
    search: agentSearch,
  });

  const { mutate: createMeeting, pending: createMeetingPending } =
    useApiMutation(api.meetings.create);

  const { mutate: updateMeeting, pending: updateMeetingPending } =
    useApiMutation(api.meetings.update);

  const form = useForm<CreateMeetingFormValues>({
    resolver: zodResolver(createMeetingSchema),
    defaultValues: {
      name: initialValues?.name || "",
      agentNanoId: initialValues?.agentNanoId || "",
      simulation: true,
    },
  });

  const isEdit = !!initialValues?.nanoId;
  const isPending = createMeetingPending || updateMeetingPending;

  async function handleCreateMeeting(values: CreateMeetingFormValues) {
    try {
      // 👇 Force default regardless of user input
      const payload = {
        ...values,
        simulation: true,
      };

      // 1️⃣ Create Convex record
      const result = await createMeeting(payload);
      const meetingNanoId = result.nanoId;

      onSuccess?.(meetingNanoId);

      // 2️⃣ Create Stream call via Next.js API
      const res = await fetch("/api/stream/create-call", {
        method: "POST",
        body: JSON.stringify({
          meetingNanoId,
          meetingName: payload.name,
          agentNanoId: payload.agentNanoId,
        }),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const { message } = await res.json().catch(() => ({ message: "" }));
        throw new Error(message || "Error al crear llamada en Stream");
      }

      // 3️⃣ (optional) success / redirect / animation
    } catch (err) {
      // ✅ One unified toast handling
      if (err instanceof ConvexError) {
        toast.error(
          err.data?.message || "Error al crear la simulación (Convex)"
        );

        if (err.data?.code === "FORBIDDEN") {
          router.push("/dashboard/upgrade");
        }
      } else if (err instanceof Error) {
        toast.error(err.message || "Error creando simulación");
      } else {
        toast.error("Error desconocido al crear simulación");
      }

      console.error(err);
    }
  }

  const onSubmit = (values: CreateMeetingFormValues) => {
    // alert(JSON.stringify(values, null, 2));
    if (isEdit) {
      // tbh I hate callbacks, I prefer async/await
      updateMeeting({ ...values, nanoId: initialValues.nanoId })
        .then(() => {
          toast.success("Sesión actualizada");

          onSuccess?.(); // 👈 closes modal
        })
        .catch((error) => {
          toast.error("Error actualizando simulación");
        });
    } else {
      handleCreateMeeting(values);
    }
  };

  return (
    <>
      <NewAgentDialog
        open={openNewAgentDialog}
        onOpenChange={setOpenNewAgentDialog}
      />
      <Form {...form}>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(onSubmit, (errors) => {
            console.error(errors);
            // Dont show front end errors in toast!
            // toast.error("Algo salió mal al validar el formulario."); // or “Something went wrong validating the form.”
          })}
        >
          <FormField
            name="name"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="ej., Simulación con paciente virtual de IA con dolor de cabeza"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {isSimulation == true && (
            <FormField
              name="agentNanoId"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Paciente</FormLabel>
                  <FormControl>
                    <CommandSelect
                      options={(agentsData?.items ?? []).map((agent) => ({
                        id: agent.nanoId, // unique id
                        value: agent.nanoId, // unique value
                        // Use agent.nanoId as key to ensure uniqueness
                        children: (
                          <div
                            key={`option-${agent.nanoId}`}
                            className="flex items-center gap-x-2"
                          >
                            <GeneratedAvatar
                              key={`avatar-${agent.nanoId}`}
                              seed={agent.name}
                              variant="botttsNeutral"
                              className="border size-6"
                            />
                            <span>{agent.name}</span>
                            {/* <span key={`id-${agent.nanoId}`}>{agent.nanoId}</span> */}
                          </div>
                        ),
                      }))}
                      onSelect={field.onChange}
                      onSearch={setAgentSearch}
                      value={field.value}
                      placeholder="Selecciona un  virtual (IA)..."
                      // If CommandSelect uses 'value' for selection, ensure it's unique (nanoId)
                    />
                  </FormControl>
                  <FormDescription>
                    {"¿No lo encuentras?"}
                    <Button
                      type="button"
                      variant={"link"}
                      // className="text-accent hover:underline"
                      onClick={() => setOpenNewAgentDialog(true)}
                    >
                      {"Crear nuevo paciente virtual (IA)"}
                    </Button>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

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
    </>
  );
};

// PRARTIS

export const MeetingsFormPRARTIS = ({
  onSuccess,
  onCancel,
  initialValues,
}: MeetingFormProps) => {
  const router = useRouter();

  const [isUploadingAudio, setIsUploadingAudio] = useState(false);

  const { mutate: createAgent, pending: createAgentPending } = useApiMutation(
    api.agents.create
  );

  const { mutate: createMeeting, pending: createMeetingPending } =
    useApiMutation(api.meetings.create);

  async function handleCreateMeeting(values: CreateMeetingFormValues) {
    try {
      // 1️⃣ Create Convex record
      const result = await createMeeting(values);
      const meetingNanoId = result.nanoId;

      // TODO: Should probably update state here showing meeting is being created
      // conditioned on isPending actually
      onSuccess?.(meetingNanoId);

      // 2️⃣ Create Stream call via Next.js API
      const res = await fetch("/api/stream/create-call", {
        method: "POST",
        body: JSON.stringify({
          meetingNanoId,
          meetingName: values.name,
          agentNanoId: values.agentNanoId,
        }),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const { message } = await res.json().catch(() => ({ message: "" }));
        throw new Error(message || "Error al crear simulación");
      }

      // 3️⃣ (optional) show success / redirect
    } catch (err) {
      // ✅ Unified toast point
      if (err instanceof ConvexError) {
        toast.error(err.data?.message || "Error al crear la simulación");

        if (err.data?.code === "FORBIDDEN") {
          router.push("/dashboard/upgrade");
        }
      } else if (err instanceof Error) {
        toast.error(err.message || "Error creando simulación");
      } else {
        toast.error("Error desconocido al crear simulación");
      }

      // optional: rethrow if upper layers need to know
      console.error(err);
    }
  }

  const isPending =
    createMeetingPending || createAgentPending || isUploadingAudio;

  return (
    <div
      className="flex flex-col items-center justify-center flex-1 p-8"
      // style={{
      //   border: "2px solid red",
      // }}
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">{"Grabación clínica"}</h2>
      </div>
      <div className="mb-8">
        {isPending == false ? (
          <button
            className={`recording-button cursor-pointer`}
            disabled={isPending}
            onClick={async () => {
              const createdAgent = await createAgent({
                name: "Paciente anónimo",
                instructions:
                  "Eres un paciente en una consulta con un doctor. El doctor busca generar una nota clinica.",
                artificial: false,
              });

              // should I validate for errors?

              // Need to set default values
              handleCreateMeeting({
                // name: "Default test value for new meeting name",
                // name it like Sesion del 9 de julio or something
                name: `Sesión del ${new Date().toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}`,
                agentNanoId: createdAgent.nanoId,
                simulation: false,
              });
            }}
          >
            <span className="material-icons text-white text-3xl">{"mic"}</span>
          </button>
        ) : (
          <Loader2Icon className="size-6 animate-spin text-accent" />
        )}
      </div>
      <div className="text-center max-w-md mb-8">
        <p className="text-sm text-muted-foreground mb-4">
          {/* {
              "Speak naturally during your patient consultation. Prartis will automatically:"
            } */}
          {
            "Habla de forma natural durante tu consulta con el paciente. Prartis automáticamente:"
          }
        </p>
        <div className="grid grid-cols-1 gap-3 text-sm">
          <div className="flex items-center space-x-2">
            <span className="material-icons text-accent text-sm">
              check_circle
            </span>
            {/* <span>Transcribe conversation accurately</span> */}
            <span>{"Transcribirá la conversación con precisión"}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="material-icons text-accent text-sm">
              check_circle
            </span>
            <span>{"Estructurará las notas en formato SOAP"}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="material-icons text-accent text-sm">
              check_circle
            </span>
            <span>{"Sugerirá códigos ICD-10"}</span>
          </div>
        </div>
      </div>
      <div className="w-full max-w-lg">
        <p className="text-sm text-muted-foreground mb-3 text-center">
          {/* {
              "Speak naturally during your patient consultation. Prartis will automatically:"
            } */}
          {"También tienes la opción de subir un audio si lo prefieres:"}
        </p>
        {/* TODO: pass on success function here */}
        <AudioUploaderPRARTIS
          onSuccess={(id) => {
            toast.success("Audio subido y procesado con éxito.");
            // onSuccess?.(id);
            router.push(`/dashboard/sessions/${id}`);
          }}
          isUploading={isUploadingAudio}
          setIsUploading={setIsUploadingAudio}
        />
      </div>
    </div>
  );
};
