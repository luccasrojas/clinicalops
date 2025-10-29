'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { RecordingInterface } from '@/features/recording/components/recording-interface'

export default function RecordingPage() {
  const router = useRouter()
  const { getDoctorID } = useAuth()
  const doctorID = getDoctorID()

  const handleComplete = (historyID: string) => {
    router.push(`/dashboard/historias/${historyID}`)
  }

  const handleError = (error: string) => {
    console.error('Recording error:', error)
    alert(`Error: ${error}`)
  }

  if (!doctorID) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500' />
      </div>
    )
  }

  return (
    <div className='container mx-auto py-8 px-4'>
      <RecordingInterface
        doctorID={doctorID}
        onComplete={handleComplete}
        onError={handleError}
      />
    </div>
  )
}
