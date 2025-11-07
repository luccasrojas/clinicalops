import { useMutation } from '@tanstack/react-query';
import { RegisterStep2Response } from '@/types/auth';
import { RegisterStep2Data } from '../types';
import { invokeLambdaApi } from '@/lib/lambda-api';

export const registerStep2 = (
  data: RegisterStep2Data
): Promise<RegisterStep2Response> => {
  return invokeLambdaApi<RegisterStep2Response>({
    functionName: 'auth_register_step2',
    payload: {
      body: JSON.stringify(data),
    },
  });
};

export const useRegisterStep2 = () => {
  return useMutation({
    mutationFn: registerStep2,
  });
};
