'use client'

import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'

export function CTA() {
  return (
    <section className='px-4 md:px-10 lg:px-20 py-10 md:py-20 mx-auto max-w-7xl'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className='bg-primary/90 text-primary-foreground rounded-xl p-10 md:p-16 flex flex-col items-center text-center gap-6'
      >
        <h2 className='text-3xl md:text-4xl font-bold'>
          ¿Listo para transformar tu práctica clínica?
        </h2>
        <p className='max-w-2xl'>
          Únete a cientos de profesionales que ya están optimizando su tiempo y
          mejorando la calidad de su atención.
        </p>
        <Button
          size='lg'
          variant='secondary'
          className='h-12 px-5 bg-white text-primary hover:bg-white/90'
        >
          Empieza Gratis Ahora
        </Button>
      </motion.div>
    </section>
  )
}
