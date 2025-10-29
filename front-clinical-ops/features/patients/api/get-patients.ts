import { webApi } from '@/lib/api-client';
import { queryOptions, useQuery } from '@tanstack/react-query';
import type { PatientsResponse } from '../types';

export const getPatients = (doctorID: string): Promise<PatientsResponse> => {
  return webApi.get('/patients', { params: { doctorID } });
};

export const getPatientsQueryOptions = (doctorID: string) => {
  return queryOptions({
    queryKey: ['patients', doctorID],
    queryFn: () => getPatients(doctorID),
    enabled: !!doctorID,
  });
};

export const usePatients = (doctorID: string, queryConfig?: any) => {
  return useQuery({
    ...getPatientsQueryOptions(doctorID),
    ...queryConfig,
  });
};
