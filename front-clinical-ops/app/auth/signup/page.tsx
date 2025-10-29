import { RegisterMultiStepForm } from '@/features/register/components/register-multi-step-form'
import Link from 'next/link'
import Image from 'next/image'

export default function RegisterPage() {
  return (
    <div className='grid min-h-svh lg:grid-cols-2'>
      <div className='flex flex-col gap-4 p-6 md:p-10'>
        <div className='flex justify-center gap-2 md:justify-start'>
          <Link href='/' className='flex items-center gap-2 font-medium text-lg'>
            <Image
              src='/LogoClinicalops.png'
              alt='ClinicalOps Logo'
              width={40}
              height={40}
              className='size-10'
            />
            <span className='font-semibold'>Clinicalops</span>
          </Link>
        </div>
        <div className='flex flex-1 items-center justify-center'>
          <div className='w-full max-w-4xl'>
            <RegisterMultiStepForm />
          </div>
        </div>
      </div>
      <div className='relative hidden lg:block bg-gradient-to-br from-blue-50 to-blue-100'>
        <div className='absolute inset-0 flex items-center justify-center p-12'>
          <Image
            width={600}
            height={600}
            src='/med-data.jpg'
            alt='Medical professional analyzing data'
            className='rounded-2xl shadow-2xl object-cover w-full h-full'
          />
        </div>
      </div>
    </div>
  )
}
