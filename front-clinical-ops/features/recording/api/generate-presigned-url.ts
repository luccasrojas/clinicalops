import { api } from '@/lib/api-client';
import { useMutation } from '@tanstack/react-query';

type GeneratePresignedUrlRequest = {
  doctorID: string;
  fileName: string;
  contentType: string;
};

type GeneratePresignedUrlResponse = {
  uploadURL: string;
  fileKey: string;
};

export const generatePresignedUrl = (
  data: GeneratePresignedUrlRequest
): Promise<GeneratePresignedUrlResponse> => {
  return api.post('/generate-presigned-url', data);
};

export const useGeneratePresignedUrl = () => {
  return useMutation({
    mutationFn: generatePresignedUrl,
  });
};
