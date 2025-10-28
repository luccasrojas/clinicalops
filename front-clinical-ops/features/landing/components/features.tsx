'use client'

import { motion } from 'motion/react'
import { Card, CardContent } from '@/components/ui/card'
import { Clock, CheckCircle2, FileText, Shield } from 'lucide-react'

const features = [
  {
    icon: Clock,
    title: 'Optimización del Tiempo',
    description:
      'Dedica más tiempo a tus pacientes y menos a la documentación.',
  },
  {
    icon: CheckCircle2,
    title: 'Reducción de Errores',
    description:
      'Nuestra IA minimiza los errores de transcripción y omisiones.',
  },
  {
    icon: FileText,
    title: 'Estandarización de Informes',
    description:
      'Asegura que todos los informes sigan un formato consistente y completo.',
  },
  {
    icon: Shield,
    title: 'Seguridad de Datos',
    description:
      'Cumplimos con los más altos estándares de privacidad y seguridad.',
  },
]

export function Features() {
  return (
    <section
      className='px-4 md:px-10 lg:px-20 py-10 md:py-20 mx-auto max-w-7xl bg-muted/50'
      id='beneficios'
    >
      <div className='flex flex-col gap-10'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className='flex flex-col gap-4 text-center'
        >
          <h2 className='text-2xl font-bold leading-tight tracking-tight'>
            ¿Por qué elegir nuestra plataforma?
          </h2>
          <p className='text-muted-foreground text-base font-normal leading-normal max-w-3xl mx-auto'>
            Descubre cómo nuestra IA puede optimizar tu flujo de trabajo,
            mejorar la precisión y asegurar la confidencialidad de los datos.
          </p>
        </motion.div>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className='h-full'>
                  <CardContent className='flex flex-col gap-4 p-6 text-center items-center'>
                    <div className='flex items-center justify-center size-12 rounded-lg bg-primary/20 text-primary'>
                      <Icon className='size-6' />
                    </div>
                    <div className='flex flex-col gap-1'>
                      <h3 className='text-base font-bold leading-tight'>
                        {feature.title}
                      </h3>
                      <p className='text-muted-foreground text-sm font-normal leading-normal'>
                        {feature.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
