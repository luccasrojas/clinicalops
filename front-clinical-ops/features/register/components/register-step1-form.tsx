'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRegisterStep1 } from '../api/register-step1';
import { useRegisterStore } from '../stores/register-store';
import { registerStep1Schema, RegisterStep1FormData } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

export function RegisterStep1Form() {
  const setStep1Data = useRegisterStore((state) => state.setStep1Data);
  const nextStep = useRegisterStore((state) => state.nextStep);
  const registerMutation = useRegisterStep1();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterStep1FormData>({
    resolver: zodResolver(registerStep1Schema),
  });

  const onSubmit = async (data: RegisterStep1FormData) => {
    try {
      setError(null);
      const { confirmPassword: _confirmPassword, ...registerData } = data;
      void _confirmPassword;
      const response = await registerMutation.mutateAsync(registerData);

      // Store step 1 data and doctorID
      setStep1Data(registerData, response.userSub);

      // Move to step 2
      nextStep();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en el registro');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full max-w-2xl">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Información Básica</h2>
        <p className="text-gray-600">
          Completa tus datos personales y credenciales de acceso
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            placeholder="Juan"
            {...register('name')}
            disabled={isSubmitting}
          />
          {errors.name && (
            <p className="text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="familyName">Apellido</Label>
          <Input
            id="familyName"
            placeholder="Pérez"
            {...register('familyName')}
            disabled={isSubmitting}
          />
          {errors.familyName && (
            <p className="text-sm text-red-600">{errors.familyName.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="doctor@ejemplo.com"
          {...register('email')}
          disabled={isSubmitting}
        />
        {errors.email && (
          <p className="text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="specialty">Especialidad</Label>
          <Input
            id="specialty"
            placeholder="Cardiología"
            {...register('specialty')}
            disabled={isSubmitting}
          />
          {errors.specialty && (
            <p className="text-sm text-red-600">{errors.specialty.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="medicalRegistry">Registro Médico</Label>
          <Input
            id="medicalRegistry"
            placeholder="MED-12345"
            {...register('medicalRegistry')}
            disabled={isSubmitting}
          />
          {errors.medicalRegistry && (
            <p className="text-sm text-red-600">
              {errors.medicalRegistry.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            {...register('password')}
            disabled={isSubmitting}
          />
          {errors.password && (
            <p className="text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            {...register('confirmPassword')}
            disabled={isSubmitting}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-red-600">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Creando cuenta...' : 'Continuar al Paso 2'}
      </Button>

      <p className="text-sm text-center text-gray-600">
        ¿Ya tienes cuenta?{' '}
        <a href="/auth/login" className="text-blue-600 hover:underline">
          Inicia sesión aquí
        </a>
      </p>
    </form>
  );
}
