'use client';

import { useRouter } from 'next/navigation';
import { Users, FileText, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { usePatients } from '../api/get-patients';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { PatientsResponse } from '../types';

type PatientsListProps = {
  doctorID: string;
};

export function PatientsList({ doctorID }: PatientsListProps) {
  const router = useRouter();
  const { data, isLoading, error } = usePatients(doctorID);

  const patients = (data as PatientsResponse | undefined)?.patients || [];
  const count = (data as PatientsResponse | undefined)?.count || 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">
          Error al cargar los pacientes: {error.message}
        </p>
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground text-lg">
          No hay pacientes registrados
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mis Pacientes</h1>
          <p className="text-muted-foreground mt-1">
            {count} paciente{count !== 1 ? 's' : ''} registrado
            {count !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {patients.map((patient) => (
          <Card
            key={patient.pacientID}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() =>
              router.push(`/dashboard/historias?patientID=${patient.pacientID}`)
            }
          >
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg capitalize">
                    {patient.nombre} {patient.apellido}
                  </h3>
                </div>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>
                    {patient.historyCount} historia
                    {patient.historyCount !== 1 ? 's' : ''} clínica
                    {patient.historyCount !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Última visita:{' '}
                    {format(new Date(patient.lastVisit), 'd MMM yyyy', {
                      locale: es,
                    })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
