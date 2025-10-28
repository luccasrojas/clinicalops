import { RegisterMultiStepForm } from '@/features/register/components/register-multi-step-form'
import Link from 'next/link'
import Image from 'next/image'

export default function RegisterPage() {
  return (
    <div className='grid min-h-svh lg:grid-cols-2'>
      <div className='flex flex-col gap-4 p-6 md:p-10'>
        <div className='flex justify-center gap-2 md:justify-start'>
          <Link href='/' className='flex items-center gap-2 font-medium'>
            <Image
              src='/LogoClinicalops.png'
              alt='ClinicalOps Logo'
              width={24}
              height={24}
              className='size-6'
            />
            Clinicalops
          </Link>
        </div>
        <div className='flex flex-1 items-center justify-center'>
          <div className='w-full max-w-4xl'>
            <RegisterMultiStepForm />
          </div>
        </div>
      </div>
      <div className='bg-muted relative hidden lg:block'>
        <Image
          width={800}
          height={600}
          src='/placeholder.svg'
          alt='Imagen de registro'
          className='absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale'
        />
      </div>
    </div>
  )
}
