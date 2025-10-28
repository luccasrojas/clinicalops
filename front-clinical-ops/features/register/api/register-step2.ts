import { authApi } from '@/lib/api-client';
import { useMutation } from '@tanstack/react-query';
import { RegisterStep2Response } from '@/types/auth';
import { RegisterStep2Data } from '../types';

export const registerStep2 = (
  data: RegisterStep2Data
): Promise<RegisterStep2Response> => {
  return authApi.post('/auth/register/step2', data);
};

export const useRegisterStep2 = () => {
  return useMutation({
    mutationFn: registerStep2,
  });
};
