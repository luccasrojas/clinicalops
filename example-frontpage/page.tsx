import React, { useState, useEffect } from 'react';
import {
  Mic,
  FileText,
  ShieldCheck,
  Activity,
  CheckCircle,
  Menu,
  X,
  ArrowRight,
  Lock,
  Database,
  Clock,
  Brain,
  Pill,
  TrendingUp,
  AlertCircle,
  Network,
  Loader2,
  Timer,
  Calculator,
  DollarSign,
  Users,
  Cpu,
  Workflow,
  FileCode,
  Stethoscope,
  Zap,
  AlertTriangle,
  BarChart2,
  Layout,
  FileJson,
  Share2,
  Code2,
  Layers,
} from 'lucide-react';

// --- Componentes Base ---

const Button = ({ children, variant = 'primary', className = '', onClick }) => {
  // Estética refinada: Bordes sutiles, sombras difusas, tipografía semibold
  const baseStyle =
    'px-8 py-3.5 rounded-full font-semibold transition-all duration-300 flex items-center gap-2 text-sm tracking-wide active:scale-95';

  const variants = {
    primary:
      'bg-[#0F172A] text-white hover:bg-[#1E293B] shadow-lg shadow-slate-900/20 border border-slate-800',
    secondary:
      'bg-white text-slate-900 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-sm',
    gradient:
      'bg-gradient-to-r from-cyan-600 to-purple-600 text-white hover:shadow-lg hover:shadow-purple-500/25 border-none',
    ghost: 'text-slate-600 hover:text-slate-900 hover:bg-slate-50',
  };

  return (
    <button
      onClick={onClick}
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Nav = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-500 border-b ${
        isScrolled
          ? 'bg-white/90 backdrop-blur-xl border-slate-100 py-4'
          : 'bg-transparent border-transparent py-6'
      }`}
    >
      <div className='max-w-7xl mx-auto px-6 lg:px-8 flex justify-between items-center'>
        {/* LOGO REFINADO: Fondo oscuro sólido, icono blanco, alineación perfecta */}
        <div className='flex items-center gap-3 group cursor-default'>
          <div className='w-10 h-10 bg-[#0F172A] rounded-xl flex items-center justify-center shadow-md ring-1 ring-slate-900/5 transition-transform group-hover:scale-105 duration-300'>
            <Activity className='text-white w-5 h-5 stroke-[2.5]' />
          </div>
          <span className='font-bold text-xl tracking-tight text-slate-900'>
            ClinicalOps<span className='text-[#7C3AED]'>.AI</span>
          </span>
        </div>

        <div className='hidden md:flex items-center gap-10'>
          <a
            href='#problema'
            className='text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors tracking-tight'
          >
            El Problema
          </a>
          <a
            href='#capacidad'
            className='text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors tracking-tight'
          >
            Capacidades
          </a>
          <a
            href='#impacto'
            className='text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors tracking-tight'
          >
            Impacto & ROI
          </a>
          <Button
            variant='primary'
            className='py-2.5 px-5 text-xs uppercase tracking-wider font-bold shadow-none hover:shadow-md'
          >
            Prueba ClinicalNotes
          </Button>
        </div>

        <button
          className='md:hidden text-slate-900'
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <X strokeWidth={1.5} />
          ) : (
            <Menu strokeWidth={1.5} />
          )}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className='md:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-xl shadow-xl border-t border-slate-100 py-8 px-6 flex flex-col gap-6 animate-in slide-in-from-top-5'>
          <a
            href='#problema'
            className='text-slate-900 font-semibold text-lg'
            onClick={() => setIsMobileMenuOpen(false)}
          >
            El Problema
          </a>
          <a
            href='#capacidad'
            className='text-slate-900 font-semibold text-lg'
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Capacidades
          </a>
          <a
            href='#impacto'
            className='text-slate-900 font-semibold text-lg'
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Impacto & ROI
          </a>
          <Button variant='gradient' className='w-full justify-center mt-2'>
            Prueba ClinicalNotes
          </Button>
        </div>
      )}
    </nav>
  );
};

const Hero = () => {
  return (
    <section className='relative pt-44 pb-32 lg:pt-56 lg:pb-40 overflow-hidden bg-white'>
      {/* Fondo Sutil y Elegante */}
      <div className='absolute inset-0 overflow-hidden pointer-events-none opacity-30'>
        <div className='absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-cyan-100 rounded-full blur-[120px] mix-blend-multiply animate-blob'></div>
        <div className='absolute top-[0%] right-[-10%] w-[800px] h-[800px] bg-purple-100 rounded-full blur-[120px] mix-blend-multiply animate-blob animation-delay-2000'></div>
        <div className='absolute bottom-[-20%] left-[20%] w-[800px] h-[800px] bg-orange-50 rounded-full blur-[120px] mix-blend-multiply animate-blob animation-delay-4000'></div>
      </div>

      <div className='max-w-7xl mx-auto px-6 lg:px-8 relative z-10 text-center'>
        <div className='inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white border border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-10 shadow-sm cursor-default hover:border-purple-200 transition-colors'>
          <Loader2 className='w-3 h-3 text-purple-600 animate-spin' />
          <span className='flex items-center'>
            Sistema Operativo de Inteligencia Clínica
          </span>
        </div>

        <h1 className='text-5xl md:text-7xl lg:text-8xl font-bold text-slate-900 tracking-tight leading-[1.1] md:leading-[0.95] mb-8 mx-auto max-w-5xl'>
          Más que transcripción. <br className='hidden md:block' />
          <span className='text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-purple-600 to-orange-500'>
            Ingeniería Clínica.
          </span>
        </h1>

        <p className='text-xl text-slate-500 max-w-3xl mx-auto mb-12 leading-relaxed font-normal text-balance'>
          ClinicalNotes no solo escucha. Redacta la nota, genera órdenes,
          codifica diagnósticos (CUPS/CIE-10) y estructura datos clínicos en
          tiempo real.
        </p>

        <div className='flex flex-col sm:flex-row gap-4 justify-center mb-32'>
          <Button variant='primary' className='justify-center'>
            Prueba ClinicalNotes{' '}
            <ArrowRight className='w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform' />
          </Button>
          <Button variant='secondary' className='justify-center'>
            Calcular ROI Institucional
          </Button>
        </div>

        {/* VISUALIZACIÓN DEL PIPELINE - ORIGINAL E INTACTA */}
        <div className='relative max-w-7xl mx-auto'>
          <div className='text-[10px] font-mono text-slate-400 mb-8 uppercase tracking-[0.3em] flex items-center justify-center gap-4 opacity-80'>
            <div className='h-px w-16 bg-gradient-to-r from-transparent to-slate-300'></div>
            <span>Flujo de Datos</span>
            <div className='h-px w-16 bg-gradient-to-l from-transparent to-slate-300'></div>
          </div>

          <div className='relative bg-slate-950 rounded-[2.5rem] border border-slate-800 shadow-2xl shadow-purple-500/10 p-1 overflow-hidden'>
            <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-950 to-slate-950'></div>
            <div className='absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent'></div>

            <div className='relative p-8 md:p-16 grid lg:grid-cols-11 gap-10 items-center z-10'>
              <div className='lg:col-span-3 flex flex-col items-center relative group'>
                <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-cyan-500/20 rounded-full blur-xl animate-pulse'></div>
                <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-cyan-500/20 rounded-full animate-[spin_15s_linear_infinite]'></div>

                <div className='relative w-24 h-24 bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-700 flex items-center justify-center shadow-lg shadow-cyan-500/10 group-hover:border-cyan-400/50 transition-colors duration-500'>
                  <Mic className='w-10 h-10 text-cyan-400' />
                  <div className='absolute -right-14 top-1/2 -translate-y-1/2 flex gap-1'>
                    <div className='w-1 bg-cyan-400 h-4 rounded-full animate-[pulse_1s_ease-in-out_infinite]'></div>
                    <div className='w-1 bg-purple-400 h-10 rounded-full animate-[pulse_1.2s_ease-in-out_infinite]'></div>
                    <div className='w-1 bg-orange-400 h-6 rounded-full animate-[pulse_0.8s_ease-in-out_infinite]'></div>
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

              <div className='hidden lg:flex lg:col-span-1 justify-center relative'>
                <div className='absolute h-px w-full bg-slate-800 top-1/2 overflow-hidden'>
                  <div className='h-full w-1/2 bg-gradient-to-r from-cyan-500 to-purple-500 blur-[2px] animate-[shimmer_2s_infinite_linear]'></div>
                </div>
                <ArrowRight className='w-5 h-5 text-slate-600 relative z-10 bg-slate-950 rounded-full p-0.5 border border-slate-800' />
              </div>

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
                        <Brain className='w-4 h-4' />
                      </div>
                      <span className='text-xs text-slate-300 font-medium'>
                        Contexto
                      </span>
                    </div>
                    <Loader2 className='w-3.5 h-3.5 text-purple-500 animate-spin opacity-0 group-hover:opacity-100 transition-opacity' />
                  </div>
                  <div className='h-px bg-white/5 w-full'></div>
                  <div className='flex items-center justify-between group'>
                    <div className='flex items-center gap-3'>
                      <div className='p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400'>
                        <Workflow className='w-4 h-4' />
                      </div>
                      <span className='text-xs text-slate-300 font-medium'>
                        Estructura
                      </span>
                    </div>
                    <CheckCircle className='w-3.5 h-3.5 text-cyan-500' />
                  </div>
                  <div className='h-px bg-white/5 w-full'></div>
                  <div className='flex items-center justify-between group'>
                    <div className='flex items-center gap-3'>
                      <div className='p-1.5 rounded-lg bg-orange-500/10 text-orange-400'>
                        <Database className='w-4 h-4' />
                      </div>
                      <span className='text-xs text-slate-300 font-medium'>
                        Codificación
                      </span>
                    </div>
                    <CheckCircle className='w-3.5 h-3.5 text-orange-500' />
                  </div>
                </div>
              </div>

              <div className='hidden lg:flex lg:col-span-1 justify-center relative'>
                <div className='absolute h-px w-full bg-slate-800 top-1/2 overflow-hidden'>
                  <div className='h-full w-1/2 bg-gradient-to-r from-purple-500 to-orange-500 blur-[2px] animate-[shimmer_2s_infinite_linear] delay-700'></div>
                </div>
                <ArrowRight className='w-5 h-5 text-slate-600 relative z-10 bg-slate-950 rounded-full p-0.5 border border-slate-800' />
              </div>

              <div className='lg:col-span-3 flex gap-4'>
                <div className='flex-1 bg-white rounded-xl p-4 border border-slate-200 shadow-xl shadow-black/20 transform hover:-translate-y-1 transition-transform duration-300'>
                  <div className='flex justify-between items-start mb-3'>
                    <div className='flex items-center gap-2'>
                      <div className='p-1 bg-orange-50 rounded text-orange-600'>
                        <FileText className='w-3.5 h-3.5' />
                      </div>
                      <span className='text-[10px] font-bold text-slate-900 uppercase tracking-tight'>
                        Nota Lista
                      </span>
                    </div>
                    <span className='text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono border border-slate-200'>
                      JSON
                    </span>
                  </div>
                  <div className='space-y-1.5 mb-2'>
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
                        <Pill className='w-3.5 h-3.5' />
                      </div>
                      <span className='text-[10px] font-bold text-slate-900 uppercase tracking-tight'>
                        Órdenes
                      </span>
                    </div>
                    <span className='text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono border border-slate-200'>
                      JSON
                    </span>
                  </div>
                  <div className='space-y-1.5 mb-2'>
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
  );
};

const ProblemCard = ({
  icon: Icon,
  title,
  description,
  gradientFrom,
  gradientTo,
}) => (
  <div className='group relative p-px rounded-[2rem] overflow-hidden transition-all duration-500 hover:-translate-y-1'>
    {/* Fondo suavizado */}
    <div
      className={`absolute inset-0 bg-gradient-to-br ${gradientFrom} ${gradientTo} opacity-10 group-hover:opacity-30 transition-opacity duration-500`}
    ></div>

    <div className='relative bg-[#0F172A] h-full rounded-[2rem] p-10 flex flex-col justify-center backdrop-blur-xl border border-white/5 group-hover:border-white/10 transition-colors'>
      <div
        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradientFrom} ${gradientTo} p-[1px] mb-6 shadow-lg`}
      >
        <div className='w-full h-full bg-[#0F172A] rounded-[10px] flex items-center justify-center'>
          <Icon className='w-5 h-5 text-white opacity-90' strokeWidth={1.5} />
        </div>
      </div>

      <h4 className='font-bold text-white text-lg mb-4 tracking-tight'>
        {title}
      </h4>
      <p className='text-slate-400 text-sm leading-relaxed font-normal text-balance'>
        {description}
      </p>
    </div>
  </div>
);

const ProblemSection = () => {
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

      <div className='max-w-7xl mx-auto px-6 lg:px-8 relative z-10'>
        <div className='text-center max-w-3xl mx-auto mb-24'>
          <div className='inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm shadow-xl'>
            <span className='relative flex h-2 w-2'>
              <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75'></span>
              <span className='relative inline-flex rounded-full h-2 w-2 bg-rose-500'></span>
            </span>
            <span className='text-[10px] font-bold text-rose-200 uppercase tracking-widest'>
              Diagnóstico Operativo
            </span>
          </div>
          <h2 className='text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-6'>
            El cuello de botella <br />{' '}
            <span className='text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-fuchsia-400 to-indigo-400'>
              invisible de su hospital
            </span>
          </h2>
          <p className='text-lg text-slate-400 font-normal leading-relaxed text-balance max-w-2xl mx-auto'>
            La carga administrativa no es solo molestia: es el mayor depresor de
            rentabilidad y calidad asistencial hoy.
          </p>
        </div>

        <div className='grid lg:grid-cols-12 gap-8 items-stretch'>
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
                  <BarChart2 className='w-5 h-5 text-cyan-400' /> Análisis de
                  Eficiencia
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
                      <Zap className='w-3 h-3 text-cyan-400' /> Con
                      ClinicalNotes
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
                      <CheckCircle className='w-4 h-4 text-white' />
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
  );
};

const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className='group relative bg-white p-8 border border-slate-100 rounded-2xl hover:border-purple-100 transition-all duration-500 h-full flex flex-col items-start hover:shadow-xl hover:shadow-slate-200/40'>
    {/* Barra de acento lateral */}
    <div className='absolute top-8 left-0 w-1 h-8 rounded-r-full bg-slate-100 group-hover:bg-purple-500 transition-all duration-500'></div>

    <div className='mb-6 pl-2'>
      <div className='p-3 rounded-xl bg-slate-50 group-hover:bg-purple-50 transition-colors duration-300'>
        <Icon className='w-6 h-6 text-slate-700 stroke-[1.5] group-hover:text-purple-600 transition-colors duration-300' />
      </div>
    </div>

    <h3 className='text-lg font-bold text-slate-900 mb-3 tracking-tight pl-2'>
      {title}
    </h3>
    <p className='text-sm text-slate-500 leading-relaxed font-normal pl-2 text-balance'>
      {description}
    </p>
  </div>
);

const Features = () => {
  const features = [
    {
      icon: Layout,
      title: 'Documentación Estructurada',
      description:
        'Redacta la nota SOAP automáticamente. No es solo voz a texto; comprende el contexto clínico y estructura la historia coherentemente.',
    },
    {
      icon: FileJson,
      title: 'Órdenes Integradas',
      description:
        'Genera automáticamente órdenes de medicamentos, laboratorios e imágenes desde la misma conversación. Detecta dosis y frecuencias.',
    },
    {
      icon: Database,
      title: 'Codificación Automática',
      description:
        'Traduce la narrativa médica a códigos estándar (CUPS, CIE-10, CUM) listos para auditoría y facturación, reduciendo glosas.',
    },
    {
      icon: Brain,
      title: 'Adaptabilidad de Estilo',
      description:
        'Aprende y replica la forma de documentar de cada especialista. No obliga al médico a cambiar su flujo mental ni narrativo.',
    },
    {
      icon: Network,
      title: 'Integración HIS/ERP',
      description:
        'Se conecta con su sistema actual (Epic, Cerner, SAP, etc.) sin cambiar la operación de fondo. Interoperabilidad real.',
    },
    {
      icon: ShieldCheck,
      title: 'Estandarización y Calidad',
      description:
        'Reduce la variabilidad entre médicos y servicios. Asegura que cada nota cumpla con los criterios de calidad y auditoría.',
    },
  ];

  return (
    <section
      id='capacidad'
      className='py-32 bg-white relative border-t border-slate-100'
    >
      <div className='max-w-7xl mx-auto px-6 lg:px-8 relative z-10'>
        <div className='mb-24 flex flex-col md:flex-row md:items-end justify-between gap-10'>
          <div className='max-w-2xl'>
            <div className='inline-block px-3 py-1 rounded-full bg-slate-50 border border-slate-200/60 mb-6'>
              <span className='text-[10px] font-bold text-slate-600 uppercase tracking-widest'>
                Capacidades Core
              </span>
            </div>
            <h2 className='text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight mb-4'>
              Hablar <span className='text-slate-300 mx-1 font-light'>/</span>{' '}
              Documentar{' '}
              <span className='text-slate-300 mx-1 font-light'>/</span> Ordenar
            </h2>
            <p className='text-lg text-slate-500 font-normal leading-relaxed text-balance'>
              Una suite completa de herramientas cognitivas diseñadas para
              eliminar la fricción, con un diseño que prioriza la claridad.
            </p>
          </div>
        </div>

        <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'>
          {features.map((f, index) => (
            <FeatureCard key={index} {...f} />
          ))}
        </div>
      </div>
    </section>
  );
};

const ROICalculator = () => {
  const [numMedicos, setNumMedicos] = useState(1);
  const [pacientesPorDia, setPacientesPorDia] = useState(24);
  const [valorConsulta, setValorConsulta] = useState(56900);
  const daysPerMonth = 24;
  const costPerNote = 755;

  // 1. Cálculo de tiempo
  const minutesSavedPerDay = numMedicos * pacientesPorDia * 5;
  const minutesSavedPerMonth = minutesSavedPerDay * daysPerMonth;

  // 2. Visualización
  const hoursSavedPerDay = (minutesSavedPerDay / 60).toFixed(1);
  const hoursSavedPerMonth = (minutesSavedPerMonth / 60).toFixed(0);

  // 3. Consultas Extra
  const consultsExtraPerMonth = Math.floor(minutesSavedPerMonth / 20);
  const consultsExtraPerDay = Math.floor(consultsExtraPerMonth / daysPerMonth);

  // 4. Ingresos
  const monthlyRevenue = consultsExtraPerMonth * valorConsulta;
  const annualRevenue = monthlyRevenue * 12;

  // 5. Costos
  const baseNotes = numMedicos * pacientesPorDia * daysPerMonth;
  const totalNotesPerMonth = baseNotes + consultsExtraPerMonth;
  const totalNotesPerYear = totalNotesPerMonth * 12;
  const annualCost = totalNotesPerYear * costPerNote;

  // 6. ROI (Multiplicador de retorno sobre inversión bruta)
  const roiValue =
    annualCost > 0 ? (annualRevenue / annualCost).toFixed(1) : '0.0';

  const formatCOP = (val) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <section
      id='impacto'
      className='py-32 bg-[#0F172A] text-white relative overflow-hidden'
    >
      {/* Fondo más limpio */}
      <div className='absolute top-0 right-0 w-[1000px] h-[1000px] bg-purple-900/5 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/3'></div>
      <div className='absolute bottom-0 left-0 w-[1000px] h-[1000px] bg-cyan-900/5 rounded-full blur-[150px] translate-y-1/3 -translate-x-1/3'></div>

      <div className='max-w-7xl mx-auto px-6 lg:px-8 relative z-10'>
        <div className='flex flex-col xl:flex-row items-end justify-between mb-20 gap-12'>
          <div className='w-full xl:w-auto'>
            <h2 className='text-4xl md:text-5xl font-bold mb-6 tracking-tight flex items-center gap-4'>
              <div className='p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20'>
                <Calculator className='w-6 h-6 text-cyan-400' />
              </div>
              Calculadora de Impacto
            </h2>
            <p className='text-lg text-slate-400 max-w-xl leading-relaxed font-normal'>
              Simule el retorno de inversión financiero directo ingresando su
              capacidad actual.
            </p>
          </div>

          <div className='bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-10 rounded-[2rem] flex flex-col md:flex-row gap-10 md:gap-14 w-full xl:w-auto shadow-2xl'>
            <div className='flex flex-col gap-5 flex-1'>
              <label className='text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2'>
                Médicos
              </label>
              <div className='flex items-baseline gap-2'>
                <span className='text-4xl font-bold text-white tracking-tighter'>
                  {numMedicos}
                </span>
              </div>
              <input
                type='range'
                min='1'
                max='50'
                step='1'
                value={numMedicos}
                onChange={(e) => setNumMedicos(Number(e.target.value))}
                className='accent-cyan-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer w-full'
              />
            </div>
            <div className='flex flex-col gap-5 flex-1'>
              <label className='text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2'>
                Pacientes/Día
              </label>
              <div className='flex items-baseline gap-2'>
                <span className='text-4xl font-bold text-white tracking-tighter'>
                  {pacientesPorDia}
                </span>
              </div>
              <input
                type='range'
                min='10'
                max='60'
                step='1'
                value={pacientesPorDia}
                onChange={(e) => setPacientesPorDia(Number(e.target.value))}
                className='accent-purple-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer w-full'
              />
            </div>
            <div className='flex flex-col gap-5 flex-1 min-w-[220px]'>
              <label className='text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2'>
                Valor Consulta
              </label>
              <div className='flex items-baseline gap-2'>
                <span className='text-3xl font-bold text-white tracking-tighter'>
                  {formatCOP(valorConsulta)}
                </span>
              </div>
              <input
                type='range'
                min='20000'
                max='200000'
                step='1000'
                value={valorConsulta}
                onChange={(e) => setValorConsulta(Number(e.target.value))}
                className='accent-orange-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer w-full'
              />
            </div>
          </div>
        </div>

        <div className='grid lg:grid-cols-3 gap-8'>
          <div className='bg-slate-900/60 backdrop-blur-sm p-10 rounded-[2.5rem] border border-slate-800 hover:border-cyan-500/30 transition-all group'>
            <div className='flex items-center justify-between mb-8'>
              <div className='p-3 bg-cyan-500/10 rounded-xl'>
                <Clock className='w-6 h-6 text-cyan-400' />
              </div>
              <span className='text-[10px] font-bold text-cyan-300 bg-cyan-900/30 px-3 py-1 rounded-full border border-cyan-500/20 uppercase tracking-widest'>
                Eficiencia
              </span>
            </div>
            <div className='space-y-2 mb-8'>
              <div className='text-5xl font-bold text-white tracking-tighter'>
                {hoursSavedPerMonth}{' '}
                <span className='text-3xl text-slate-500 font-medium'>h</span>
              </div>
              <div className='text-xs text-slate-400 font-medium'>
                Ahorradas mensualmente
              </div>
            </div>
            <div className='h-px bg-slate-800 mb-6'></div>
            <div className='flex justify-between text-sm text-slate-300 font-medium'>
              <span>Por médico diario</span>
              <span className='text-white font-bold'>{hoursSavedPerDay} h</span>
            </div>
          </div>

          <div className='bg-gradient-to-b from-slate-800 to-slate-900 p-10 rounded-[2.5rem] border border-purple-500/30 shadow-2xl shadow-purple-900/20 relative group transform md:-translate-y-4'>
            <div className='flex items-center justify-between mb-8'>
              <div className='p-3 bg-purple-500/10 rounded-xl'>
                <TrendingUp className='w-6 h-6 text-purple-400' />
              </div>
              <span className='text-[10px] font-bold text-purple-300 bg-purple-900/30 px-3 py-1 rounded-full border border-purple-500/20 uppercase tracking-widest'>
                Crecimiento
              </span>
            </div>
            <div className='space-y-2 mb-8'>
              <div className='text-5xl font-bold text-white tracking-tighter'>
                +{consultsExtraPerMonth}
              </div>
              <div className='text-xs text-slate-400 font-medium'>
                Consultas adicionales / mes
              </div>
            </div>
            <div className='h-px bg-purple-500/20 mb-6'></div>
            <p className='text-xs text-purple-200/80 font-medium italic'>
              Sin contratar personal adicional.
            </p>
          </div>

          <div className='bg-slate-900/60 backdrop-blur-sm p-10 rounded-[2.5rem] border border-slate-800 hover:border-orange-500/30 transition-all group'>
            <div className='flex items-center justify-between mb-8'>
              <div className='p-3 bg-orange-500/10 rounded-xl'>
                <DollarSign className='w-6 h-6 text-orange-400' />
              </div>
              <span className='text-[10px] font-bold text-orange-300 bg-orange-900/30 px-3 py-1 rounded-full border border-orange-500/20 uppercase tracking-widest'>
                Rentabilidad
              </span>
            </div>
            <div className='space-y-2 mb-8'>
              <div className='text-4xl font-bold text-white tracking-tighter'>
                {formatCOP(annualRevenue)}
              </div>
              <div className='text-xs text-slate-400 font-medium'>
                Ingreso Adicional Anual
              </div>
            </div>
            <div className='h-px bg-slate-800 mb-6'></div>
            <div className='flex justify-between text-sm text-slate-300 font-medium'>
              <span>ROI Estimado</span>
              <span className='text-orange-400 font-bold text-lg'>
                {roiValue}x
              </span>
            </div>
          </div>
        </div>

        <div className='mt-16 text-center'>
          <p className='text-[10px] text-slate-600 font-medium uppercase tracking-wider'>
            *Estimaciones basadas en promedios de industria. Resultados pueden
            variar.
          </p>
        </div>
      </div>
    </section>
  );
};

const SecurityCompact = () => {
  return (
    <section
      id='seguridad'
      className='py-32 bg-white border-t border-slate-100'
    >
      <div className='max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-16'>
        <div className='max-w-2xl'>
          <h3 className='text-2xl font-bold text-slate-900 mb-5 tracking-tight'>
            Seguridad Enterprise-Grade
          </h3>
          <p className='text-lg text-slate-500 leading-relaxed text-justify font-normal text-balance'>
            Cumplimiento total HIPAA, GDPR y SOC2 Tipo II. Sus datos nunca se
            usan para entrenar modelos públicos. Soberanía de datos garantizada.
          </p>
        </div>
        <div className='flex gap-12 opacity-50 hover:opacity-100 transition-all duration-500 grayscale hover:grayscale-0'>
          <div className='flex flex-col items-center gap-3 group'>
            <ShieldCheck className='w-8 h-8 text-slate-800' strokeWidth={1.5} />
            <span className='text-[10px] font-bold text-slate-600 uppercase tracking-widest'>
              HIPAA
            </span>
          </div>
          <div className='flex flex-col items-center gap-3 group'>
            <Lock className='w-8 h-8 text-slate-800' strokeWidth={1.5} />
            <span className='text-[10px] font-bold text-slate-600 uppercase tracking-widest'>
              SOC2
            </span>
          </div>
          <div className='flex flex-col items-center gap-3 group'>
            <Database className='w-8 h-8 text-slate-800' strokeWidth={1.5} />
            <span className='text-[10px] font-bold text-slate-600 uppercase tracking-widest'>
              AES-256
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className='bg-slate-50 pt-24 pb-12 border-t border-slate-200'>
      <div className='max-w-7xl mx-auto px-6 lg:px-8'>
        <div className='grid grid-cols-1 md:grid-cols-12 gap-12 mb-16'>
          <div className='md:col-span-5'>
            <div className='flex items-center gap-3 mb-6'>
              <div className='w-8 h-8 bg-[#0F172A] rounded-lg flex items-center justify-center shadow-sm'>
                <Activity className='text-white w-4 h-4 stroke-[2.5]' />
              </div>
              <span className='font-bold text-xl text-slate-900 tracking-tight'>
                ClinicalOps<span className='text-[#7C3AED]'>.AI</span>
              </span>
            </div>
            <p className='text-slate-500 max-w-sm mb-8 text-sm leading-relaxed font-medium'>
              Construyendo el sistema operativo de inteligencia para el cuidado
              de la salud moderno.
            </p>
          </div>

          <div className='md:col-span-2'>
            <h4 className='font-bold text-slate-900 mb-6 text-sm tracking-wide'>
              Producto
            </h4>
            <ul className='space-y-3'>
              <li>
                <a
                  href='#'
                  className='text-slate-500 hover:text-purple-600 transition-colors text-sm font-medium'
                >
                  ClinicalNotes
                </a>
              </li>
              <li>
                <a
                  href='#'
                  className='text-slate-500 hover:text-purple-600 transition-colors text-sm font-medium'
                >
                  Integraciones
                </a>
              </li>
              <li>
                <a
                  href='#'
                  className='text-slate-500 hover:text-purple-600 transition-colors text-sm font-medium'
                >
                  Seguridad
                </a>
              </li>
            </ul>
          </div>

          <div className='md:col-span-2'>
            <h4 className='font-bold text-slate-900 mb-6 text-sm tracking-wide'>
              Empresa
            </h4>
            <ul className='space-y-3'>
              <li>
                <a
                  href='#'
                  className='text-slate-500 hover:text-purple-600 transition-colors text-sm font-medium'
                >
                  Visión
                </a>
              </li>
              <li>
                <a
                  href='#'
                  className='text-slate-500 hover:text-purple-600 transition-colors text-sm font-medium'
                >
                  Carreras
                </a>
              </li>
              <li>
                <a
                  href='#'
                  className='text-slate-500 hover:text-purple-600 transition-colors text-sm font-medium'
                >
                  Contacto
                </a>
              </li>
            </ul>
          </div>

          <div className='md:col-span-3'>
            <h4 className='font-bold text-slate-900 mb-6 text-sm tracking-wide'>
              Ventas Enterprise
            </h4>
            <p className='text-slate-500 mb-4 text-sm'>
              Transforme su red hospitalaria hoy.
            </p>
            <a
              href='mailto:sales@clinicalops.ai'
              className='text-base font-bold text-slate-900 hover:text-purple-600 transition-colors'
            >
              sales@clinicalops.ai
            </a>
          </div>
        </div>

        <div className='border-t border-slate-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4'>
          <p className='text-xs text-slate-400 font-medium'>
            © 2024 ClinicalOps.AI Inc.
          </p>
          <div className='text-xs text-slate-400 flex gap-6 font-medium'>
            <span>Bogotá</span>
            <span>San Francisco</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

function App() {
  return (
    <div className='min-h-screen bg-white font-sans text-slate-900 selection:bg-purple-100 selection:text-purple-900'>
      <Nav />
      <main>
        <Hero />
        <ProblemSection />
        <Features />
        <ROICalculator />
        <SecurityCompact />
      </main>
      <Footer />
    </div>
  );
}

export default App;
