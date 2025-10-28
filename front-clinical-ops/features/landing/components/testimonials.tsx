'use client'

import { motion } from 'motion/react'
import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image'

const testimonials = [
  {
    quote:
      'ClinicalOps ha transformado mi consulta. El tiempo que ahorro en documentación lo dedico a lo que realmente importa: mis pacientes. Es una herramienta indispensable.',
    author: 'Dr. Elena García',
    role: 'Cardióloga',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA-n6mwwXCbZf0IUr5GZTJ9RPCIeag2C8QU09RzxLVbVkvN48P4jZcZdRpj7DAZPnLwOPDBBf5RF_2s01tiTnndj4ozrOftt3iZeXPBizItTsaRdpunO-CVBpY8wBaCshxEmflljnZkekTy7eVG-ixFGJvPTlU80gRKL7jIeXxoWQZLn82pSqEHvp-i1YdqlU7qSX99QEFkKVJZAtOQh-U4O2JZSrrZbQpn88iSkzzjB6gMf4EEdoXja3y0Rzk8ZlTtpw6U8f2FI6cc',
  },
  {
    quote:
      'La precisión y estandarización de los informes es increíble. Se acabaron las notas ilegibles y los datos omitidos. La seguridad que ofrece es un plus.',
    author: 'Dr. Carlos Rodríguez',
    role: 'Médico General',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA7up887m_Y6kn-7N6ckCXwHQE-TpcVr-A9BJ9RNygQJg8DnmexOHpOdJ4A0KnD3WAmAT7ifolqWj99TacEKm2msoHbRLimEIi-lJMhQFvxJcbq92w1kjtZeyvAXeGAnXIzLu2jgZP5iC4VNdKbtPZnCspN7i4r41xIrFb4aRDWdz0Q1OIxCPZGlULHhwTCOAdergEQXb5zLvS_m_R6HAAy5YT4Ucyfz2y75tLaZzy7j-46ISvdocGVO2WuH7kYyGfwynPXyLkB7FM7',
  },
  {
    quote:
      'Al principio era escéptico, pero la implementación fue sencilla y los resultados inmediatos. Ha mejorado la eficiencia de toda nuestra clínica.',
    author: 'Dr. Javier Mendoza',
    role: 'Director de Clínica',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBMU0OxfR-Atyq-f_K8GSrPVzKmHW14Ozb-cJp6iiarwtXMuDkbwMGT4ZM0KcsuCA8Kb3yNwmItLE7XqCaMmYfVH2kfRBImA8EVsBNSNhNb4fML1e-kYRb6WNOotwCHXtThPu2cUt-3FUjBW6AVq_0AkRdnCeahbEHamDrsgU731KUHvtoZEnlHB6JDiXR2bLvB2Mr-FYKsueFccGbezMEKsYwz3D_5eP3JnyTRrTARNFr-nGRA5VNYjBQSSI1HH-Iu4yc8rXYBBfOZ',
  },
]

export function Testimonials() {
  return (
    <section
      className='px-4 md:px-10 lg:px-20 py-10 md:py-20 mx-auto max-w-7xl bg-muted/50'
      id='testimonios'
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
            Lo que dicen los profesionales de la salud
          </h2>
        </motion.div>
        <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8 w-full'>
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className='h-full'>
                <CardContent className='flex flex-col gap-4 p-6'>
                  <p className='text-muted-foreground italic'>
                    &quot;{testimonial.quote}&quot;
                  </p>
                  <div className='flex items-center gap-4 mt-2'>
                    <Image
                      className='size-12 rounded-full object-cover'
                      src={testimonial.image}
                      alt={`Portrait of ${testimonial.author}`}
                      width={48}
                      height={48}
                    />
                    <div>
                      <p className='font-bold'>{testimonial.author}</p>
                      <p className='text-sm text-muted-foreground'>
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
