import { useMutation } from '@tanstack/react-query';
import { RegisterStep1Response } from '@/types/auth';
import { RegisterStep1Data } from '../types';
import { invokeLambdaApi } from '@/lib/lambda-api';

export const registerStep1 = (
  data: RegisterStep1Data
): Promise<RegisterStep1Response> => {
  return invokeLambdaApi<RegisterStep1Response>({
    functionName: 'auth_register_step1',
    payload: {
      body: JSON.stringify(data),
    },
  });
};

export const useRegisterStep1 = () => {
  return useMutation({
    mutationFn: registerStep1,
  });
};
