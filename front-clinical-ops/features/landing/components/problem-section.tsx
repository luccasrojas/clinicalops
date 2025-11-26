import {
  Clock,
  AlertTriangle,
  Brain,
  BarChart2,
  Zap,
  CheckCircle,
} from 'lucide-react'
import { ProblemCard } from './problem-card'

export function ProblemSection() {
  return (
    <section
      id='problema'
      className='py-32 bg-[#020617] relative overflow-hidden'
    >
      <div className='absolute inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute top-0 right-0 w-[800px] h-[800px] bg-purple-900/10 rounded-full blur-[150px]'></div>
        <div className='absolute bottom-0 left-0 w-[800px] h-[800px] bg-cyan-900/10 rounded-full blur-[150px]'></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
      </div>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10'>
        <div className='text-center max-w-3xl mx-auto mb-16 sm:mb-20 lg:mb-24'>
          <div className='inline-flex items-center gap-2 mb-4 sm:mb-6 px-3 sm:px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm shadow-xl'>
            <span className='relative flex h-2 w-2' aria-hidden='true'>
              <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75 motion-reduce:animate-none'></span>
              <span className='relative inline-flex rounded-full h-2 w-2 bg-rose-500'></span>
            </span>
            <span className='text-[10px] font-bold text-rose-200 uppercase tracking-widest'>
              Diagnóstico Operativo
            </span>
          </div>
          <h2 className='text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-4 sm:mb-6 px-4'>
            El cuello de botella <br className='hidden sm:block' />{' '}
            <span className='text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-fuchsia-400 to-indigo-400'>
              invisible de su hospital
            </span>
          </h2>
          <p className='text-base sm:text-lg text-slate-400 font-normal leading-relaxed text-balance max-w-2xl mx-auto px-4'>
            La carga administrativa no es solo molestia: es el mayor depresor de
            rentabilidad y calidad asistencial hoy.
          </p>
        </div>

        <div className='grid lg:grid-cols-12 gap-6 sm:gap-8 items-stretch'>
          <div className='lg:col-span-7 grid sm:grid-cols-2 gap-6'>
            <div className='sm:col-span-2'>
              <ProblemCard
                icon={Clock}
                title='50% del Tiempo Perdido'
                description='Médicos convertidos en transcriptores. La mitad de la jornada se pierde digitando historias en lugar de atender pacientes.'
                gradientFrom='from-rose-500'
                gradientTo='to-pink-600'
              />
            </div>
            <ProblemCard
              icon={AlertTriangle}
              title='Glosas y Rechazos'
              description='Errores de codificación manual (CIE-10) cuestan millones en devoluciones y reprocesos.'
              gradientFrom='from-orange-500'
              gradientTo='to-amber-500'
            />
            <ProblemCard
              icon={Brain}
              title='Burnout Médico'
              description="La fatiga por 'pantalla' es la causa #1 de rotación de especialistas."
              gradientFrom='from-indigo-500'
              gradientTo='to-cyan-500'
            />
          </div>

          <div className='lg:col-span-5 flex flex-col'>
            <div className='relative h-full bg-slate-900/40 backdrop-blur-xl rounded-[2rem] border border-white/5 p-10 flex flex-col justify-between overflow-hidden group'>
              <div>
                <h3 className='text-lg font-bold text-white mb-10 flex items-center gap-3 relative z-10 tracking-tight'>
                  <BarChart2
                    className='w-5 h-5 text-cyan-400'
                    aria-hidden='true'
                  />{' '}
                  Análisis de Eficiencia
                </h3>

                <div className='mb-10 relative z-10'>
                  <div className='flex justify-between text-[11px] font-bold text-slate-400 mb-3 uppercase tracking-widest'>
                    <span>Método Tradicional</span>
                    <span className='text-rose-400'>20 min / paciente</span>
                  </div>
                  <div className='h-3 w-full bg-slate-800 rounded-full overflow-hidden flex'>
                    <div className='h-full w-[35%] bg-slate-600'></div>
                    <div className='h-full w-[65%] bg-rose-500/30 relative'></div>
                  </div>
                  <div className='flex justify-between mt-3 text-[10px] font-medium text-slate-500'>
                    <span>Atención (7m)</span>
                    <span>Digitación (13m)</span>
                  </div>
                </div>

                <div className='relative z-10'>
                  <div className='flex justify-between text-[11px] font-bold text-white mb-3 uppercase tracking-widest'>
                    <span className='flex items-center gap-2'>
                      <Zap
                        className='w-3 h-3 text-cyan-400'
                        aria-hidden='true'
                      />{' '}
                      Con ClinicalNotes
                    </span>
                    <span className='text-cyan-400'>15 min / paciente</span>
                  </div>
                  <div className='h-10 w-full bg-slate-800 rounded-xl overflow-hidden flex relative ring-1 ring-cyan-500/30'>
                    <div className='h-full w-[90%] bg-gradient-to-r from-cyan-600 via-cyan-500 to-indigo-500 flex items-center px-4'>
                      <span className='text-[10px] font-bold text-white tracking-widest'>
                        ATENCIÓN HUMANA
                      </span>
                    </div>
                    <div className='h-full w-[10%] bg-emerald-500 flex items-center justify-center'>
                      <CheckCircle
                        className='w-4 h-4 text-white'
                        aria-hidden='true'
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-6 mt-12 relative z-10'>
                <div className='p-5 rounded-2xl bg-white/5 border border-white/5'>
                  <div className='text-slate-400 text-[10px] uppercase font-bold mb-2 tracking-wider'>
                    Tiempo Ahorrado
                  </div>
                  <div className='text-3xl font-bold text-white tracking-tighter'>
                    2h
                    <span className='text-sm text-slate-500 font-medium ml-1'>
                      /día
                    </span>
                  </div>
                </div>
                <div className='p-5 rounded-2xl bg-white/5 border border-white/5'>
                  <div className='text-slate-400 text-[10px] uppercase font-bold mb-2 tracking-wider'>
                    Ingresos Extra
                  </div>
                  <div className='text-3xl font-bold text-white tracking-tighter'>
                    12x
                    <span className='text-sm text-slate-500 font-medium ml-1'>
                      {' '}
                      ROI
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
