import { z } from 'zod';

// Step 1: Basic doctor information
export const registerStep1Schema = z.object({
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  confirmPassword: z.string(),
  name: z.string().min(2, 'El nombre es requerido'),
  familyName: z.string().min(2, 'El apellido es requerido'),
  specialty: z.string().min(3, 'La especialidad es requerida'),
  medicalRegistry: z.string().min(3, 'El registro médico es requerido'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

// Step 2: Example clinical history
export const registerStep2Schema = z.object({
  exampleHistory: z.union([
    z.literal(''),
    z
      .string()
      .min(100, 'La historia clínica debe tener al menos 100 caracteres')
      .max(10000, 'La historia clínica no puede exceder 10,000 caracteres'),
  ]),
});

export type RegisterStep1FormData = z.infer<typeof registerStep1Schema>;
export type RegisterStep2FormData = z.infer<typeof registerStep2Schema>;

export type RegisterStep1Data = Omit<
  RegisterStep1FormData,
  'confirmPassword'
>;

export type RegisterStep2Data = {
  doctorID: string;
  email: string;
  name: string;
  familyName: string;
  specialty: string;
  medicalRegistry: string;
  exampleHistory?: string;
};
