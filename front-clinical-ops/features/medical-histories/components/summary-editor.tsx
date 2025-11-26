'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Sparkles, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useGenerateSummary } from '../api/generate-summary';
import { useUpdateMetadata } from '../api/update-metadata';
import type { MedicalHistory } from '../types';

// Validation schema
const summarySchema = z.object({
  diagnosis: z.string().min(1, 'El diagnóstico es requerido'),
  summary: z
    .string()
    .min(1, 'El resumen es requerido')
    .refine((val) => {
      const wordCount = val.trim().split(/\s+/).length;
      return wordCount <= 15;
    }, 'El resumen debe tener máximo 15 palabras'),
});

type SummaryFormData = z.infer<typeof summarySchema>;

type SummaryEditorProps = {
  history: MedicalHistory;
  onSuccess?: () => void;
};

export function SummaryEditor({ history, onSuccess }: SummaryEditorProps) {
  const [wordCount, setWordCount] = useState(0);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SummaryFormData>({
    resolver: zodResolver(summarySchema),
    defaultValues: {
      diagnosis: history.metaData?.diagnosis || '',
      summary: history.metaData?.summary || '',
    },
  });

  const generateMutation = useGenerateSummary();
  const updateMutation = useUpdateMetadata();

  // Watch the summary field to update word count
  const summaryValue = watch('summary');
  useState(() => {
    const words = summaryValue?.trim().split(/\s+/).filter(Boolean).length || 0;
    setWordCount(words);
  });

  const handleGenerateWithAI = async () => {
    try {
      const result = await generateMutation.mutateAsync({
        jsonData: history.jsonData,
      });

      setValue('diagnosis', result.diagnosis);
      setValue('summary', result.summary);

      const words = result.summary.trim().split(/\s+/).filter(Boolean).length;
      setWordCount(words);
    } catch (error) {
      console.error('Error generating summary:', error);
    }
  };

  const onSubmit = async (data: SummaryFormData) => {
    try {
      await updateMutation.mutateAsync({
        historyID: history.historyID,
        metaData: {
          diagnosis: data.diagnosis,
          summary: data.summary,
          createdBy: history.metaData?.createdBy,
        },
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error updating metadata:', error);
    }
  };

  const isLoading = generateMutation.isPending || updateMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumen de Historia Clínica</CardTitle>
        <CardDescription>
          Edita el diagnóstico y resumen o genéralos automáticamente con IA
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Diagnosis Field */}
          <div className="space-y-2">
            <Label htmlFor="diagnosis">Diagnóstico Principal</Label>
            <Input
              id="diagnosis"
              {...register('diagnosis')}
              placeholder="Ej: Hipertensión arterial no controlada"
              disabled={isLoading}
            />
            {errors.diagnosis && (
              <p className="text-sm text-destructive">{errors.diagnosis.message}</p>
            )}
          </div>

          {/* Summary Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="summary">Resumen Breve</Label>
              <span
                className={`text-xs ${
                  wordCount > 15 ? 'text-destructive' : 'text-muted-foreground'
                }`}
              >
                {wordCount}/15 palabras
              </span>
            </div>
            <Textarea
              id="summary"
              {...register('summary')}
              placeholder="Ej: Paciente presenta hipertensión no controlada, se ajusta medicación y control en 2 semanas"
              rows={3}
              disabled={isLoading}
              onChange={(e) => {
                register('summary').onChange(e);
                const words = e.target.value.trim().split(/\s+/).filter(Boolean).length;
                setWordCount(words);
              }}
            />
            {errors.summary && (
              <p className="text-sm text-destructive">{errors.summary.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Máximo 15 palabras. Describe brevemente lo que ocurrió en la consulta.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleGenerateWithAI}
              disabled={isLoading}
              className="flex-1"
            >
              {generateMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Generar con IA
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Guardar
            </Button>
          </div>

          {/* Success/Error Messages */}
          {updateMutation.isSuccess && (
            <p className="text-sm text-green-600">
              Resumen actualizado correctamente
            </p>
          )}
          {updateMutation.isError && (
            <p className="text-sm text-destructive">
              Error al actualizar el resumen. Intenta nuevamente.
            </p>
          )}
          {generateMutation.isError && (
            <p className="text-sm text-destructive">
              Error al generar el resumen con IA. Intenta nuevamente.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
