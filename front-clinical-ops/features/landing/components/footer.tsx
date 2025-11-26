import { Activity } from 'lucide-react'

export function Footer() {
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
  )
}
