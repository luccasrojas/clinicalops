import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invokeLambdaApi } from '@/lib/lambda-api';
import type {
  UpdateMedicalRecordPayload,
  UpdateMedicalRecordResponse,
} from '../types/api';

export const updateMedicalRecord = (data: UpdateMedicalRecordPayload) => {
  return invokeLambdaApi<UpdateMedicalRecordResponse>({
    functionName: 'update_medical_record',
    payload: {
      body: JSON.stringify(data),
    },
  });
};

export const useUpdateMedicalRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMedicalRecord,
    onSuccess: (_, variables) => {
      if (variables.historyID) {
        queryClient.invalidateQueries({ queryKey: ['medical-record', variables.historyID] });
        queryClient.invalidateQueries({ queryKey: ['medical-histories'] });
      }
    },
  });
};
