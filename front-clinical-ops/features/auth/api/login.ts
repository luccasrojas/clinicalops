import { useMutation } from '@tanstack/react-query';
import { LoginResponse } from '../types';
import { invokeLambdaApi } from '@/lib/lambda-api';

export type LoginData = {
  email: string;
  password: string;
};

export const login = (data: LoginData): Promise<LoginResponse> => {
  return invokeLambdaApi<LoginResponse>({
    functionName: 'auth_login',
    payload: {
      body: JSON.stringify(data),
    },
  });
};

export const useLogin = () => {
  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      // Store tokens in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('idToken', data.idToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
    },
  });
};
