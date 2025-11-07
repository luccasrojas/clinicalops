import { queryOptions, useQuery } from '@tanstack/react-query';
import type { PatientsResponse } from '../types';
import { invokeLambdaApi } from '@/lib/lambda-api';

export const getPatients = (doctorID: string): Promise<PatientsResponse> => {
  return invokeLambdaApi<PatientsResponse>({
    functionName: 'get_patients',
    payload: {
      queryStringParameters: { doctorID },
    },
  });
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
