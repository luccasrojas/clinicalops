'use client'

import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function Hero() {
  return (
    <section className='px-4 md:px-10 lg:px-20 py-10 md:py-20 mx-auto max-w-7xl'>
      <div className='flex flex-col gap-10 md:flex-row md:items-center'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className='flex flex-col gap-6 text-center md:text-left md:flex-1'
        >
          <div className='flex flex-col gap-4'>
            <h1 className='text-4xl font-black leading-tight tracking-tight text-foreground md:text-5xl'>
              Revoluciona tus Historias Clínicas con Inteligencia Artificial
            </h1>
            <h2 className='text-base font-normal leading-normal text-muted-foreground md:text-lg'>
              Genera informes detallados, precisos y estructurados en minutos,
              no en horas.
            </h2>
          </div>
          <div className='flex justify-center md:justify-start'>
            <Link href='/auth/register'>
              <Button
                size='lg'
                className='h-12 px-5 text-base hover:cursor-pointer hover:bg-primary/90 hover:scale-105 transition-all duration-200 ease-in-out'
              >
                Regístrate Gratis Ahora
              </Button>
            </Link>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className='w-full md:flex-1'
        >
          <div
            className='w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl shadow-lg'
            style={{
              backgroundImage:
                'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAKC_fMEnD5renR-l3ZD3Wh5n9FVfsFoJ7NvIx_PxFvWkGcnNu_B3kbZXAsqSks2Ms4AXWQtHZdZWbnghDfPPwb3A5bBrpp4Ty7iluDtTbDKs43-ckfWfP6PtwxoB79freh8p6djx5PCyie6eT2Gecl2xMpxPdOO1Mv0FaiwNbkUQ_Q3o2eMu52GavWEffMvnqIBrhBlg3R3jhtIJT8BdycABSQWWdzhBJBCKYuyVTGB-Jzm3Sl_iFzyu0aIEwls73Nxzh2vCVdSwPH")',
            }}
            role='img'
            aria-label='Abstract visualization of AI neural networks and medical data'
          />
        </motion.div>
      </div>
    </section>
  )
}
