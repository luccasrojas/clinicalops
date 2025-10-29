import { webApi } from '@/lib/api-client';
import { queryOptions, useQuery } from '@tanstack/react-query';
import type {
  MedicalHistoriesResponse,
  MedicalHistoriesFilters,
} from '../types';

export const getMedicalHistories = (
  filters: MedicalHistoriesFilters
): Promise<MedicalHistoriesResponse> => {
  return webApi.get('/medical-histories', { params: filters });
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
