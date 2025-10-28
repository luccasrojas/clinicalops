'use client'

import { motion } from 'motion/react'

const steps = [
  {
    number: '1',
    title: 'Ingresa los Datos',
    description:
      'Introduce la información del paciente de forma rápida, ya sea por texto o dictado por voz.',
  },
  {
    number: '2',
    title: 'La IA Procesa',
    description:
      'Nuestra inteligencia artificial analiza, estructura y redacta la historia clínica en segundos.',
  },
  {
    number: '3',
    title: 'Revisa y Exporta',
    description:
      'Valida el informe generado, realiza ajustes si es necesario y expórtalo en tu formato preferido.',
  },
]

export function HowItWorks() {
  return (
    <section
      className='px-4 md:px-10 lg:px-20 py-10 md:py-20 mx-auto max-w-7xl'
      id='funcionamiento'
    >
      <div className='flex flex-col items-center gap-10'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className='text-center'
        >
          <h2 className='text-2xl font-bold leading-tight tracking-tight'>
            Simple, Rápido e Inteligente
          </h2>
          <p className='text-muted-foreground mt-2'>
            Nuestro proceso está diseñado para integrarse perfectamente en tu
            rutina diaria.
          </p>
        </motion.div>
        <div className='grid md:grid-cols-3 gap-8 w-full'>
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className='flex flex-col items-center text-center gap-4'
            >
              <div className='relative flex items-center justify-center'>
                <div className='flex items-center justify-center size-16 rounded-full bg-primary text-primary-foreground font-bold text-2xl'>
                  {step.number}
                </div>
              </div>
              <h3 className='font-bold text-lg'>{step.title}</h3>
              <p className='text-sm text-muted-foreground'>
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
