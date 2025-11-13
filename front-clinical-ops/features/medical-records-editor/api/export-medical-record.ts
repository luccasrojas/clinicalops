import { useMutation } from '@tanstack/react-query';
import { invokeLambdaApi } from '@/lib/lambda-api';
import type {
  ExportMedicalRecordPayload,
  ExportMedicalRecordResponse,
} from '../types/api';

export const exportMedicalRecord = (payload: ExportMedicalRecordPayload) => {
  return invokeLambdaApi<ExportMedicalRecordResponse>({
    functionName: 'export_medical_record',
    payload: {
      pathParameters: {
        historyID: payload.historyID,
      },
      queryStringParameters: {
        format: payload.format,
      },
    },
  });
};

export const useExportMedicalRecord = () => {
  return useMutation({
    mutationFn: exportMedicalRecord,
  });
};
