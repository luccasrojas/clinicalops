import { webApi } from '@/lib/api-client';
import { useMutation } from '@tanstack/react-query';
import type { PresignedUrlRequest, PresignedUrlResponse } from '../types';

export const generatePresignedUrl = (
  data: PresignedUrlRequest
): Promise<PresignedUrlResponse> => {
  return webApi.post('/presigned-url', data);
};

export const useGeneratePresignedUrl = () => {
  return useMutation({
    mutationFn: generatePresignedUrl,
  });
};
