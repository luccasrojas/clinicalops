import {
  Loader2,
  ArrowRight,
  Mic,
  Brain,
  Workflow,
  Database,
  FileText,
  Pill,
  CheckCircle,
  Cpu,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SectionBadge } from '@/components/ui/section-badge'

export function Hero() {
  return (
    <section className='relative pt-44 pb-32 lg:pt-56 lg:pb-40 overflow-hidden bg-white'>
      {/* Background effects - pure CSS */}
      <div className='absolute inset-0 overflow-hidden pointer-events-none opacity-30'>
        <div className='absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-cyan-100 rounded-full blur-[120px] mix-blend-multiply animate-blob'></div>
        <div className='absolute top-[0%] right-[-10%] w-[800px] h-[800px] bg-purple-100 rounded-full blur-[120px] mix-blend-multiply animate-blob animation-delay-2000'></div>
        <div className='absolute bottom-[-20%] left-[20%] w-[800px] h-[800px] bg-orange-50 rounded-full blur-[120px] mix-blend-multiply animate-blob animation-delay-4000'></div>
      </div>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center'>
        <SectionBadge
          icon={
            <Loader2
              className='w-3 h-3 text-purple-600 animate-spin motion-reduce:animate-none'
              aria-hidden='true'
            />
          }
          className='mb-8 sm:mb-10 cursor-default hover:border-purple-200 transition-colors'
        >
          Sistema Operativo de Inteligencia Clínica
        </SectionBadge>

        <h1 className='text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold text-slate-900 tracking-tight leading-[1.1] md:leading-[0.95] mb-6 sm:mb-8 mx-auto max-w-5xl px-2'>
          Más que transcripción. <br className='hidden md:block' />
          <span className='text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-purple-600 to-orange-500'>
            Ingeniería Clínica.
          </span>
        </h1>

        <p className='text-base sm:text-lg md:text-xl text-slate-500 max-w-3xl mx-auto mb-10 sm:mb-12 leading-relaxed font-normal text-balance px-4'>
          ClinicalNotes no solo escucha. Redacta la nota, genera órdenes,
          codifica diagnósticos (CUPS/CIE-10) y estructura datos clínicos en
          tiempo real.
        </p>

        <div className='flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-20 sm:mb-32 px-4'>
          <Button
            variant='primary'
            className='justify-center focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2'
            aria-label='Prueba ClinicalNotes - Iniciar prueba gratuita'
          >
            Prueba ClinicalNotes{' '}
            <ArrowRight
              className='w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform motion-reduce:transition-none motion-reduce:group-hover:translate-x-0'
              aria-hidden='true'
            />
          </Button>
          <Button
            variant='secondary'
            className='justify-center focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2'
            aria-label='Calcular ROI Institucional - Abrir calculadora'
          >
            Calcular ROI Institucional
          </Button>
        </div>

        {/* Pipeline visualization */}
        <div
          className='relative max-w-7xl mx-auto px-4'
          role='region'
          aria-label='Flujo de datos del sistema'
        >
          <div className='text-[10px] font-mono text-slate-400 mb-6 sm:mb-8 uppercase tracking-[0.3em] flex items-center justify-center gap-2 sm:gap-4 opacity-80'>
            <div
              className='h-px w-8 sm:w-16 bg-gradient-to-r from-transparent to-slate-300'
              aria-hidden='true'
            ></div>
            <span>Flujo de Datos</span>
            <div
              className='h-px w-8 sm:w-16 bg-gradient-to-l from-transparent to-slate-300'
              aria-hidden='true'
            ></div>
          </div>

          <div className='relative bg-slate-950 rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] border border-slate-800 shadow-2xl shadow-purple-500/10 p-1 overflow-hidden'>
            <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-950 to-slate-950'></div>
            <div className='absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent'></div>

            <div className='relative p-6 sm:p-8 md:p-12 lg:p-16 grid lg:grid-cols-11 gap-6 sm:gap-8 lg:gap-10 items-center z-10'>
              {/* Audio Input */}
              <div className='lg:col-span-3 flex flex-col items-center relative group'>
                <div
                  className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-cyan-500/20 rounded-full blur-xl animate-pulse motion-reduce:animate-none'
                  aria-hidden='true'
                ></div>
                <div
                  className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-cyan-500/20 rounded-full animate-[spin_15s_linear_infinite] motion-reduce:animate-none'
                  aria-hidden='true'
                ></div>

                <div className='relative w-24 h-24 bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-700 flex items-center justify-center shadow-lg shadow-cyan-500/10 group-hover:border-cyan-400/50 transition-colors duration-500'>
                  <Mic className='w-10 h-10 text-cyan-400' aria-hidden='true' />
                  <div
                    className='absolute -right-14 top-1/2 -translate-y-1/2 flex gap-1'
                    aria-hidden='true'
                  >
                    <div className='w-1 bg-cyan-400 h-4 rounded-full animate-[pulse_1s_ease-in-out_infinite] motion-reduce:animate-none'></div>
                    <div className='w-1 bg-purple-400 h-10 rounded-full animate-[pulse_1.2s_ease-in-out_infinite] motion-reduce:animate-none'></div>
                    <div className='w-1 bg-orange-400 h-6 rounded-full animate-[pulse_0.8s_ease-in-out_infinite] motion-reduce:animate-none'></div>
                  </div>
                </div>
                <div className='mt-8 text-center'>
                  <h4 className='text-white font-bold text-sm uppercase tracking-wider'>
                    Audio Clínico
                  </h4>
                  <p className='text-slate-500 text-xs mt-1.5 font-medium'>
                    Encriptado AES-256
                  </p>
                </div>
              </div>

              {/* Arrow 1 */}
              <div
                className='hidden lg:flex lg:col-span-1 justify-center relative'
                aria-hidden='true'
              >
                <div className='absolute h-px w-full bg-slate-800 top-1/2 overflow-hidden'>
                  <div className='h-full w-1/2 bg-gradient-to-r from-cyan-500 to-purple-500 blur-[2px] animate-[shimmer_2s_infinite_linear] motion-reduce:animate-none'></div>
                </div>
                <ArrowRight className='w-5 h-5 text-slate-600 relative z-10 bg-slate-950 rounded-full p-0.5 border border-slate-800' />
              </div>

              {/* Clinical Engine */}
              <div className='lg:col-span-3 bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/10 p-0 overflow-hidden relative shadow-2xl shadow-black/50'>
                <div className='bg-white/5 px-5 py-3 border-b border-white/5 flex justify-between items-center'>
                  <span className='text-[10px] text-purple-300 font-mono uppercase tracking-wider flex items-center gap-2 font-bold'>
                    <Cpu className='w-3 h-3' /> MOTOR CLÍNICO
                  </span>
                  <div className='flex gap-1.5'>
                    <div className='w-1.5 h-1.5 rounded-full bg-white/20'></div>
                    <div className='w-1.5 h-1.5 rounded-full bg-white/20'></div>
                  </div>
                </div>

                <div className='p-6 space-y-4'>
                  <div className='flex items-center justify-between group'>
                    <div className='flex items-center gap-3'>
                      <div className='p-1.5 rounded-lg bg-purple-500/10 text-purple-400'>
                        <Brain className='w-4 h-4' aria-hidden='true' />
                      </div>
                      <span className='text-xs text-slate-300 font-medium'>
                        Contexto
                      </span>
                    </div>
                    <Loader2
                      className='w-3.5 h-3.5 text-purple-500 animate-spin opacity-0 group-hover:opacity-100 transition-opacity motion-reduce:animate-none'
                      aria-hidden='true'
                    />
                  </div>
                  <div
                    className='h-px bg-white/5 w-full'
                    aria-hidden='true'
                  ></div>
                  <div className='flex items-center justify-between group'>
                    <div className='flex items-center gap-3'>
                      <div className='p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400'>
                        <Workflow className='w-4 h-4' aria-hidden='true' />
                      </div>
                      <span className='text-xs text-slate-300 font-medium'>
                        Estructura
                      </span>
                    </div>
                    <CheckCircle
                      className='w-3.5 h-3.5 text-cyan-500'
                      aria-hidden='true'
                    />
                  </div>
                  <div
                    className='h-px bg-white/5 w-full'
                    aria-hidden='true'
                  ></div>
                  <div className='flex items-center justify-between group'>
                    <div className='flex items-center gap-3'>
                      <div className='p-1.5 rounded-lg bg-orange-500/10 text-orange-400'>
                        <Database className='w-4 h-4' aria-hidden='true' />
                      </div>
                      <span className='text-xs text-slate-300 font-medium'>
                        Codificación
                      </span>
                    </div>
                    <CheckCircle
                      className='w-3.5 h-3.5 text-orange-500'
                      aria-hidden='true'
                    />
                  </div>
                </div>
              </div>

              {/* Arrow 2 */}
              <div
                className='hidden lg:flex lg:col-span-1 justify-center relative'
                aria-hidden='true'
              >
                <div className='absolute h-px w-full bg-slate-800 top-1/2 overflow-hidden'>
                  <div className='h-full w-1/2 bg-gradient-to-r from-purple-500 to-orange-500 blur-[2px] animate-[shimmer_2s_infinite_linear] delay-700 motion-reduce:animate-none'></div>
                </div>
                <ArrowRight className='w-5 h-5 text-slate-600 relative z-10 bg-slate-950 rounded-full p-0.5 border border-slate-800' />
              </div>

              {/* Output Cards */}
              <div className='lg:col-span-3 flex gap-4'>
                <div className='flex-1 bg-white rounded-xl p-4 border border-slate-200 shadow-xl shadow-black/20 transform hover:-translate-y-1 transition-transform duration-300'>
                  <div className='flex justify-between items-start mb-3'>
                    <div className='flex items-center gap-2'>
                      <div className='p-1 bg-orange-50 rounded text-orange-600'>
                        <FileText className='w-3.5 h-3.5' aria-hidden='true' />
                      </div>
                      <span className='text-[10px] font-bold text-slate-900 uppercase tracking-tight'>
                        Nota Lista
                      </span>
                    </div>
                    <span className='text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono border border-slate-200'>
                      JSON
                    </span>
                  </div>
                  <div className='space-y-1.5 mb-2' aria-hidden='true'>
                    <div className='h-1.5 w-3/4 bg-slate-200 rounded-full'></div>
                    <div className='h-1.5 w-full bg-slate-100 rounded-full'></div>
                    <div className='h-1.5 w-5/6 bg-slate-100 rounded-full'></div>
                  </div>
                  <div className='pt-2 border-t border-slate-50'>
                    <span className='text-[8px] text-orange-600 font-medium'>
                      CIE-10 Codificado
                    </span>
                  </div>
                </div>

                <div className='flex-1 bg-white rounded-xl p-4 border border-slate-200 shadow-xl shadow-black/20 transform hover:-translate-y-1 transition-transform duration-300 delay-75'>
                  <div className='flex justify-between items-start mb-3'>
                    <div className='flex items-center gap-2'>
                      <div className='p-1 bg-cyan-50 rounded text-cyan-600'>
                        <Pill className='w-3.5 h-3.5' aria-hidden='true' />
                      </div>
                      <span className='text-[10px] font-bold text-slate-900 uppercase tracking-tight'>
                        Órdenes
                      </span>
                    </div>
                    <span className='text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono border border-slate-200'>
                      JSON
                    </span>
                  </div>
                  <div className='space-y-1.5 mb-2' aria-hidden='true'>
                    <div className='h-1.5 w-1/2 bg-slate-200 rounded-full'></div>
                    <div className='h-1.5 w-full bg-slate-100 rounded-full'></div>
                    <div className='h-1.5 w-2/3 bg-slate-100 rounded-full'></div>
                  </div>
                  <div className='pt-2 border-t border-slate-50'>
                    <span className='text-[8px] text-cyan-600 font-medium'>
                      Rx / Labs / Img
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
