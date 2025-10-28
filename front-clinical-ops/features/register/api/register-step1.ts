import { authApi } from '@/lib/api-client';
import { useMutation } from '@tanstack/react-query';
import { RegisterStep1Response } from '@/types/auth';
import { RegisterStep1Data } from '../types';

export const registerStep1 = (
  data: RegisterStep1Data
): Promise<RegisterStep1Response> => {
  return authApi.post('/auth/register/step1', data);
};

export const useRegisterStep1 = () => {
  return useMutation({
    mutationFn: registerStep1,
  });
};
