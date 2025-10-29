'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLogin } from '../api/login';
import { useAuth } from '../hooks/use-auth';
import { loginSchema, LoginFormData } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login: authLogin } = useAuth();
  const loginMutation = useLogin();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null);
      const response = await loginMutation.mutateAsync(data);

      // Update auth context
      authLogin(response.user, {
        accessToken: response.accessToken,
        idToken: response.idToken,
        refreshToken: response.refreshToken,
      });

      // Redirect to callback URL or dashboard
      const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
      router.push(callbackUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 w-full">
      <div className="space-y-3">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bienvenido</h1>
          <p className="text-gray-600">Ingresa a tu cuenta de ClinicalOps</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            Correo electrónico
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="doctor@ejemplo.com"
            {...register('email')}
            disabled={isSubmitting}
            className="h-11"
          />
          {errors.email && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <span className="text-lg">⚠️</span> {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Contraseña
            </Label>
            <a href="#" className="text-sm text-blue-600 hover:underline">
              ¿Olvidaste tu contraseña?
            </a>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            {...register('password')}
            disabled={isSubmitting}
            className="h-11"
          />
          {errors.password && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <span className="text-lg">⚠️</span> {errors.password.message}
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <span className="text-xl">❌</span>
          <span className="flex-1">{error}</span>
        </div>
      )}

      <Button 
        type="submit" 
        className="w-full h-11 text-base font-medium bg-blue-600 hover:bg-blue-700" 
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <span className="animate-spin mr-2">⏳</span> Iniciando sesión...
          </>
        ) : (
          'Iniciar sesión'
        )}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">¿Nuevo en ClinicalOps?</span>
        </div>
      </div>

      <div className="text-center">
        <a 
          href="/auth/signup" 
          className="inline-flex items-center justify-center w-full h-11 px-4 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
        >
          Crear una cuenta nueva
        </a>
      </div>
    </form>
  );
}
