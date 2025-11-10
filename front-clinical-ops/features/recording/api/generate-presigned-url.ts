import { useMutation } from '@tanstack/react-query';
import type { PresignedUrlRequest, PresignedUrlResponse } from '../types';
import { invokeLambdaApi } from '@/lib/lambda-api';

export const generatePresignedUrl = (
  data: PresignedUrlRequest
): Promise<PresignedUrlResponse> => {
  return invokeLambdaApi<PresignedUrlResponse>({
    functionName: 'generate_presigned_url',
    payload: data,
  });
};

export const useGeneratePresignedUrl = () => {
  return useMutation({
    mutationFn: generatePresignedUrl,
  });
};
