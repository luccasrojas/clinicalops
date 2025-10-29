'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { MedicalHistoriesDashboard } from '@/features/medical-histories/components/medical-histories-dashboard';

export default function DashboardPage() {
  const router = useRouter();
  const { getDoctorID } = useAuth();
  const doctorID = getDoctorID();

  const handleNewRecording = () => {
    router.push('/dashboard/grabacion');
  };

  if (!doctorID) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 px-4 sm:py-6 sm:px-6 lg:py-8 lg:px-8">
      <MedicalHistoriesDashboard
        doctorID={doctorID}
        onNewRecording={handleNewRecording}
      />
    </div>
  );
}
