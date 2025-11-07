import { queryOptions, useQuery } from '@tanstack/react-query';
import type {
  MedicalHistoriesResponse,
  MedicalHistoriesFilters,
} from '../types';
import { invokeLambdaApi } from '@/lib/lambda-api';

const sanitizeFilters = (
  filters: MedicalHistoriesFilters
): MedicalHistoriesFilters => {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    )
  ) as MedicalHistoriesFilters;
};

export const getMedicalHistories = (
  filters: MedicalHistoriesFilters
): Promise<MedicalHistoriesResponse> => {
  const params = sanitizeFilters(filters);

  return invokeLambdaApi<MedicalHistoriesResponse>({
    functionName: 'get_medical_histories',
    payload: {
      queryStringParameters: params,
    },
  });
};

export const getMedicalHistoriesQueryOptions = (
  filters: MedicalHistoriesFilters
) => {
  return queryOptions({
    queryKey: ['medical-histories', filters],
    queryFn: () => getMedicalHistories(filters),
    enabled: !!filters.doctorID,
  });
};

export const useMedicalHistories = (
  filters: MedicalHistoriesFilters,
  queryConfig?: any
) => {
  return useQuery({
    ...getMedicalHistoriesQueryOptions(filters),
    ...queryConfig,
  });
};
