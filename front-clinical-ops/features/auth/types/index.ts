import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export type User = {
  sub: string;
  email: string;
  name?: string;
  lastName?: string;
  especiality?: string;
  medicalRegistry?: string;
  doctorID?: string;
  username?: string;
  familyName?: string;
};

export type AuthTokens = {
  accessToken: string;
  idToken: string;
  refreshToken: string;
};

export type AuthState = {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};

export type LoginResponse = {
  message: string;
  user: User;
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresIn?: number;
  tokenType?: string;
};
