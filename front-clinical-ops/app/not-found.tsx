import Link from 'next/link'
import { FileQuestion, Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

export default function NotFound() {
  return (
    <div className='min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4'>
      <div className='max-w-2xl w-full text-center'>
        {/* Logo */}
        <div className='flex justify-center mb-8'>
          <Link
            href='/'
            className='flex items-center gap-2 font-medium text-xl'
          >
            <Image
              src='/LogoClinicalops.png'
              alt='ClinicalOps Logo'
              width={32}
              height={32}
              className='size-8'
            />
            <span className='text-gray-900'>Clinicalops</span>
          </Link>
        </div>

        {/* Medical themed icon */}
        <div className='mb-6 flex justify-center'>
          <div className='relative'>
            <div className='absolute inset-0 bg-blue-100 rounded-full blur-2xl opacity-50 animate-pulse' />
            <div className='relative bg-white rounded-full p-8 shadow-xl border border-blue-100'>
              <FileQuestion
                className='h-24 w-24 text-blue-600'
                strokeWidth={1.5}
              />
            </div>
          </div>
        </div>

        {/* Error code */}
        <h1 className='text-8xl font-bold text-gray-900 mb-4'>404</h1>

        {/* Medical themed message */}
        <h2 className='text-3xl font-semibold text-gray-800 mb-4'>
          Diagnóstico: Página no encontrada
        </h2>

        <p className='text-lg text-gray-600 mb-2'>
          Esta página no está en nuestro historial clínico.
        </p>
        <p className='text-base text-gray-500 mb-8'>
          Parece que la ruta que buscas ha sido dada de alta o nunca existió en
          nuestro sistema.
        </p>

        {/* Action buttons */}
        <div className='flex flex-col sm:flex-row gap-4 justify-center items-center'>
          <Button
            asChild
            size='lg'
            className='bg-blue-600 hover:bg-blue-700 text-white min-w-[200px]'
          >
            <Link href='/'>
              <Home className='mr-2 h-5 w-5' />
              Volver al inicio
            </Link>
          </Button>

          <Button
            variant='outline'
            size='lg'
            className='min-w-[200px]'
            onClick={() => window.history.back()}
          >
            <ArrowLeft className='mr-2 h-5 w-5' />
            Página anterior
          </Button>
        </div>

        {/* Additional help */}
        <div className='mt-12 p-6 bg-blue-50 rounded-lg border border-blue-100'>
          <p className='text-sm text-gray-700'>
            <strong>Sugerencias de navegación:</strong>
          </p>
          <ul className='mt-3 text-sm text-gray-600 space-y-2'>
            <li>
              <Link href='/' className='text-blue-600 hover:underline'>
                → Ir a la página principal
              </Link>
            </li>
            <li>
              <Link
                href='/auth/login'
                className='text-blue-600 hover:underline'
              >
                → Iniciar sesión
              </Link>
            </li>
            <li>
              <Link
                href='/auth/signup'
                className='text-blue-600 hover:underline'
              >
                → Registrarse como doctor
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
