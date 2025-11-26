import { useMutation } from '@tanstack/react-query';
import type { GenerateSummaryRequest, GenerateSummaryResponse } from '../types';
import { invokeLambdaApi } from '@/lib/lambda-api';

export const generateSummary = async (
  data: GenerateSummaryRequest
): Promise<GenerateSummaryResponse> => {
  return invokeLambdaApi<GenerateSummaryResponse>({
    functionName: 'generate_summary',
    payload: data,
  });
};

export const useGenerateSummary = () => {
  return useMutation({
    mutationFn: generateSummary,
  });
};
