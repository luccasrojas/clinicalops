import { queryOptions, useQuery, type UseQueryOptions } from '@tanstack/react-query';
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

type PatientsQueryKey = ['patients', string];

type PatientsQueryOptions = UseQueryOptions<
  PatientsResponse,
  Error,
  PatientsResponse,
  PatientsQueryKey
>;

export const getPatientsQueryOptions = (doctorID: string) => {
  return queryOptions({
    queryKey: ['patients', doctorID] as PatientsQueryKey,
    queryFn: () => getPatients(doctorID),
    enabled: !!doctorID,
  });
};

export const usePatients = (
  doctorID: string,
  queryConfig?: Omit<PatientsQueryOptions, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    ...getPatientsQueryOptions(doctorID),
    ...queryConfig,
  });
};
