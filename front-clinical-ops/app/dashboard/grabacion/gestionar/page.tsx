'use client'

import { lazy, Suspense } from 'react'
import { useAuth } from '@/features/auth/hooks/use-auth'

// Lazy load the recording management panel for better performance
const RecordingManagementPanel = lazy(() =>
  import('@/features/recording/components/recording-management-panel').then(
    (mod) => ({
      default: mod.RecordingManagementPanel,
    }),
  ),
)

function LoadingFallback() {
  return (
    <div className='flex items-center justify-center min-h-screen'>
      <div className='text-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4' />
        <p className='text-gray-600'>Cargando gestión de grabaciones...</p>
      </div>
    </div>
  )
}

export default function RecordingManagementPage() {
  const { getDoctorID } = useAuth()
  const doctorID = getDoctorID()

  if (!doctorID) {
    return <LoadingFallback />
  }

  return (
    <div className='min-h-screen'>
      <Suspense fallback={<LoadingFallback />}>
        <RecordingManagementPanel doctorID={doctorID} />
      </Suspense>
    </div>
  )
}
