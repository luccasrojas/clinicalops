"use client";

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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTemplateSchema } from "@convexdev/zod/templatesSchema";
import { CreateTemplateFormValues, TemplateGetOne } from "../types";
import {
  useTemplatesCreateMutation,
  useTemplatesUpdateMutation,
} from "@/hooks/use-api-mutation";
import {
  Loader2Icon,
  CheckCircle2Icon,
  ClockIcon,
  LockIcon,
  ArrowRightIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TemplateFormProps {
  initialValues?: TemplateGetOne;
  blocked?: boolean;
  blockMessage?: string;
  blockTooltip?: string;
  blockLink?: string;
  blockLinkText?: string;
}

export const TemplateForm = ({
  initialValues,
  blocked = true,
  blockMessage = "Esta función no está disponible en tu plan actual.",
  blockTooltip = "Actualiza tu plan para editar esta plantilla.",
  blockLink = "/dashboard/upgrade",
  blockLinkText = "Actualizar plan",
}: TemplateFormProps) => {
  const form = useForm<CreateTemplateFormValues>({
    resolver: zodResolver(createTemplateSchema),
    defaultValues: {
      name: "Plantilla por defecto",
      clinicalNoteExampleContent:
        initialValues?.clinicalNoteExampleContent || "",
    },
  });

  const { mutate: createTemplate, pending: createTemplatePending } =
    useTemplatesCreateMutation();
  const { mutate: updateTemplate, pending: updateTemplatePending } =
    useTemplatesUpdateMutation();

  const isEdit = !!initialValues?.nanoId;
  const isPending = createTemplatePending || updateTemplatePending;

  const [saveStatus, setSaveStatus] = useState<
    "idle" | "unsaved" | "saving" | "saved"
  >("idle");

  const initialContent = useRef(
    initialValues?.clinicalNoteExampleContent || ""
  );

  const handleAutosave = useDebouncedCallback(
    async (data: CreateTemplateFormValues) => {
      try {
        if (blocked) return; // no autosave if blocked
        setSaveStatus("saving");
        if (isEdit) {
          await updateTemplate({ ...data, nanoId: initialValues.nanoId });
        } else {
          await createTemplate(data);
        }
        setSaveStatus("saved");
      } catch (err) {
        setSaveStatus("unsaved");
        toast.error("Error al guardar automáticamente la plantilla.");
        console.error(err);
      }
    },
    1500
  );

  const watchedClinicalNoteExampleContent = form.watch(
    "clinicalNoteExampleContent"
  );

  useEffect(() => {
    if (blocked) return; // do nothing if blocked
    if (watchedClinicalNoteExampleContent === initialContent.current) return;

    setSaveStatus("unsaved");
    handleAutosave(form.getValues());
  }, [watchedClinicalNoteExampleContent]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (data: CreateTemplateFormValues) => {
    if (blocked) return; // prevent submit
    try {
      setSaveStatus("saving");
      if (isEdit) {
        await updateTemplate({ ...data, nanoId: initialValues.nanoId });
        toast.success("Plantilla actualizada correctamente.");
      } else {
        await createTemplate(data);
        toast.success("Plantilla creada correctamente.");
      }
      setSaveStatus("saved");
      initialContent.current = data.clinicalNoteExampleContent;
    } catch (err) {
      setSaveStatus("unsaved");
      toast.error("Error al guardar la plantilla.");
      console.error(err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-6">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-bold tracking-tight mb-2">
          {isEdit ? "Editar plantilla" : "Personalizar plantilla"}
        </h2>
        <p className="text-muted-foreground text-sm">
          Define el contenido base de tu plantilla clínica.
        </p>
      </div>

      <Form {...form}>
        <form
          className="space-y-8 relative"
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
        >
          {/* 🌟 Block banner */}
          {blocked && (
            <div className="rounded-lg border border-yellow-300 bg-yellow-100 text-yellow-900 p-4 flex flex-col sm:flex-row items-center sm:items-center justify-between gap-3 mb-2 shadow-sm">
              <div className="flex flex-col md:flex-row items-center gap-2 text-sm">
                <LockIcon className="size-4 text-yellow-700" />
                <span>{blockMessage}</span>
              </div>
              {blockLink && (
                <Link
                  href={blockLink}
                  className="text-sm font-medium text-yellow-800 hover:text-yellow-900 underline flex items-center gap-1"
                >
                  {blockLinkText}
                  <ArrowRightIcon className="size-3" />
                </Link>
              )}
            </div>
          )}

          {/* Hidden name field */}
          <FormField
            name="name"
            control={form.control}
            render={({ field }) => (
              <FormItem className="hidden">
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Nombre interno" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Template clinicalNoteExampleContent */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <FormField
                    name="clinicalNoteExampleContent"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ejemplo de nota clínica</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            disabled={blocked}
                            placeholder="Copia y pega aquí el ejemplo de una nota clínica que hayas escrito en el pasado..."
                            className={`min-h-[250px] resize-y bg-sidebar focus-visible:ring-accent ${
                              blocked ? "opacity-70 cursor-not-allowed" : ""
                            }`}
                          />
                        </FormControl>
                        <FormDescription>
                          El ejemplo ayudará a personalizar las notas generadas.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TooltipTrigger>
              {blocked && (
                // I want something like className="translate-y-[-3px]"
                <TooltipContent className="translate-y-6">
                  <p>{blockTooltip}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>

          {/* Status bar */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {saveStatus === "unsaved" && (
                <>
                  <ClockIcon className="size-4 text-yellow-500" />
                  <span>Cambios no guardados</span>
                </>
              )}
              {saveStatus === "saving" && (
                <>
                  <Loader2Icon className="size-4 animate-spin text-accent" />
                  <span>Guardando...</span>
                </>
              )}
              {saveStatus === "saved" && (
                <>
                  <CheckCircle2Icon className="size-4 text-green-500" />
                  <span>Cambios guardados</span>
                </>
              )}
            </div>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      variant="accent"
                      type="submit"
                      disabled={isPending || saveStatus === "saving" || blocked}
                      className={blocked ? "opacity-70 cursor-not-allowed" : ""}
                    >
                      {isPending && (
                        <Loader2Icon className="mr-2 size-4 animate-spin" />
                      )}
                      {isEdit ? "Guardar cambios" : "Guardar plantilla"}
                    </Button>
                  </div>
                </TooltipTrigger>
                {blocked && (
                  <TooltipContent>
                    <p>{blockTooltip}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default TemplateForm;
