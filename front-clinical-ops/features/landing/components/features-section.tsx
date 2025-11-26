import { FEATURES } from '../constants/landing-data'
import { FeatureCard } from './feature-card'

export function FeaturesSection() {
  return (
    <section
      id='capacidad'
      className='py-32 bg-white relative border-t border-slate-100'
    >
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10'>
        <div className='mb-16 sm:mb-20 lg:mb-24 flex flex-col md:flex-row md:items-end justify-between gap-8 sm:gap-10'>
          <div className='max-w-2xl'>
            <div className='inline-block px-3 py-1 rounded-full bg-slate-50 border border-slate-200/60 mb-4 sm:mb-6'>
              <span className='text-[10px] font-bold text-slate-600 uppercase tracking-widest'>
                Capacidades Core
              </span>
            </div>
            <h2 className='text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight mb-3 sm:mb-4'>
              Hablar <span className='text-slate-300 mx-1 font-light'>/</span>{' '}
              Documentar{' '}
              <span className='text-slate-300 mx-1 font-light'>/</span> Ordenar
            </h2>
            <p className='text-base sm:text-lg text-slate-500 font-normal leading-relaxed text-balance'>
              Una suite completa de herramientas cognitivas diseñadas para
              eliminar la fricción, con un diseño que prioriza la claridad.
            </p>
          </div>
        </div>

        <div className='grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8'>
          {FEATURES.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  )
}
