'use client';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { PatientsList } from '@/features/patients/components/patients-list';

export default function PacientesPage() {
  const { getDoctorID } = useAuth();
  const doctorID = getDoctorID();

  if (!doctorID) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 px-4 sm:py-6 sm:px-6 lg:py-8 lg:px-8">
      <PatientsList doctorID={doctorID} />
    </div>
  );
}
