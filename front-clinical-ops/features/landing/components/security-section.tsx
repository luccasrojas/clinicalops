import { ShieldCheck, Lock, Database } from 'lucide-react'

export function SecuritySection() {
  return (
    <section
      id='seguridad'
      className='py-20 sm:py-24 lg:py-32 bg-white border-t border-slate-100'
    >
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-10 sm:gap-12 lg:gap-16'>
        <div className='max-w-2xl text-center md:text-left'>
          <h3 className='text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-5 tracking-tight'>
            Seguridad Enterprise-Grade
          </h3>
          <p className='text-base sm:text-lg text-slate-500 leading-relaxed font-normal text-balance'>
            Cumplimiento total HIPAA, GDPR y SOC2 Tipo II. Sus datos nunca se
            usan para entrenar modelos públicos. Soberanía de datos garantizada.
          </p>
        </div>
        <div
          className='flex gap-8 sm:gap-10 lg:gap-12 opacity-50 hover:opacity-100 transition-all duration-500 grayscale hover:grayscale-0 motion-reduce:transition-none'
          role='list'
          aria-label='Certificaciones de seguridad'
        >
          <div
            className='flex flex-col items-center gap-3 group'
            role='listitem'
          >
            <ShieldCheck
              className='w-8 h-8 text-slate-800'
              strokeWidth={1.5}
              aria-hidden='true'
            />
            <span className='text-[10px] font-bold text-slate-600 uppercase tracking-widest'>
              HIPAA
            </span>
          </div>
          <div
            className='flex flex-col items-center gap-3 group'
            role='listitem'
          >
            <Lock
              className='w-8 h-8 text-slate-800'
              strokeWidth={1.5}
              aria-hidden='true'
            />
            <span className='text-[10px] font-bold text-slate-600 uppercase tracking-widest'>
              SOC2
            </span>
          </div>
          <div
            className='flex flex-col items-center gap-3 group'
            role='listitem'
          >
            <Database
              className='w-8 h-8 text-slate-800'
              strokeWidth={1.5}
              aria-hidden='true'
            />
            <span className='text-[10px] font-bold text-slate-600 uppercase tracking-widest'>
              AES-256
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
