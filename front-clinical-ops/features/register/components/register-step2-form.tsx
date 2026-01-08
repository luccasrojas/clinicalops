'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useRegisterStep2 } from '../api/register-step2';
import { useLogin } from '@/features/auth/api/login';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useRegisterStore } from '../stores/register-store';
import { registerStep2Schema, RegisterStep2FormData } from '../types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

export function RegisterStep2Form() {
  const router = useRouter();
  const step1Data = useRegisterStore((state) => state.step1Data);
  const doctorID = useRegisterStore((state) => state.doctorID);
  const reset = useRegisterStore((state) => state.reset);
  const registerStep2Mutation = useRegisterStep2();
  const loginMutation = useLogin();
  const { login: authLogin } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterStep2FormData>({
    resolver: zodResolver(registerStep2Schema),
  });

  const exampleHistory = useWatch({
    control,
    name: 'exampleHistory',
    defaultValue: '',
  });
  const characterCount = exampleHistory?.length || 0;

  const completeRegistration = async (exampleHistoryText: string) => {
    if (!step1Data || !doctorID) {
      setError('Datos del paso 1 no encontrados. Por favor, vuelve al paso 1.');
      return;
    }

    try {
      setError(null);
      await registerStep2Mutation.mutateAsync({
        doctorID,
        email: step1Data.email,
        name: step1Data.name,
        familyName: step1Data.familyName,
        specialty: step1Data.specialty,
        medicalRegistry: step1Data.medicalRegistry,
        exampleHistory: exampleHistoryText,
      });

      const loginResponse = await loginMutation.mutateAsync({
        email: step1Data.email,
        password: step1Data.password,
      });

      authLogin(loginResponse.user, {
        accessToken: loginResponse.accessToken,
        idToken: loginResponse.idToken,
        refreshToken: loginResponse.refreshToken,
      });

      // Reset register state
      reset();

      // Redirect to dashboard directly after login
      router.push('/dashboard');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Error al completar el registro'
      );
    }
  };

  const onSubmit = async (data: RegisterStep2FormData) => {
    await completeRegistration(data.exampleHistory);
  };

  const onSkip = async () => {
    await completeRegistration('');
  };

  const isExampleHistoryInvalid = characterCount > 0 && characterCount < 100;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 w-full max-w-4xl">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Historia Clínica de Ejemplo</h2>
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <p className="text-sm text-blue-900">
            <strong>¿Por qué necesitamos esto?</strong> Tu ejemplo de historia clínica
            nos ayuda a entrenar la IA para que se ajuste a tu estilo de
            escritura y pueda generar mejores resultados personalizados.
          </p>
        </div>
        <p className="text-gray-600">
          Por favor, escribe un ejemplo de una historia clínica que hayas
          elaborado anteriormente. Asegúrate de <strong>no incluir datos reales</strong> de
          pacientes. Puedes modificar nombres, fechas y cualquier información
          identificable.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="exampleHistory">Historia Clínica de Ejemplo</Label>
          <span
            className={`text-sm ${
              isExampleHistoryInvalid
                ? 'text-red-600'
                : characterCount > 10000
                ? 'text-red-600'
                : 'text-gray-500'
            }`}
          >
            {characterCount} / 10,000 caracteres
            {isExampleHistoryInvalid && ` (mínimo 100)`}
          </span>
        </div>
        <Textarea
          id="exampleHistory"
          placeholder="Ejemplo:

Paciente masculino de 45 años que acude por dolor torácico de inicio súbito hace 2 horas...

Motivo de Consulta: Dolor torácico

Enfermedad Actual: El paciente refiere que hace aproximadamente 2 horas, mientras realizaba actividad física moderada, presentó dolor precordial tipo opresivo, intensidad 8/10...

Antecedentes Personales: HTA diagnosticada hace 5 años, en tratamiento con...

Examen Físico: TA 150/95 mmHg, FC 95 lpm, FR 18 rpm, SpO2 96% AA..."
          rows={15}
          {...register('exampleHistory')}
          disabled={isSubmitting}
          className="font-mono text-sm"
        />
        {errors.exampleHistory && (
          <p className="text-sm text-red-600">
            {errors.exampleHistory.message}
          </p>
        )}
        <p className="text-xs text-gray-500">
          Tip: Incluye secciones como motivo de consulta, enfermedad actual,
          antecedentes, examen físico, y plan de manejo para mejores resultados.
        </p>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            reset();
            router.push('/auth/signup');
          }}
          disabled={isSubmitting}
          className="flex-1"
        >
          Volver al Paso 1
        </Button>
        <Button
          type="button"
          onClick={onSkip}
          disabled={isSubmitting}
          className="flex-1"
        >
          Omitir este paso
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || isExampleHistoryInvalid}
          className="flex-1"
        >
          {isSubmitting ? 'Completando registro...' : 'Completar Registro'}
        </Button>
      </div>

      <p className="text-xs text-center text-gray-500">
        Al completar el registro, aceptas nuestros términos y condiciones.
        Toda la información será procesada de forma segura.
      </p>
    </form>
  );
}
