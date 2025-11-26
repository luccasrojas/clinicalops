'use client'

import { useState, useMemo } from 'react'
import { Calculator, Clock, TrendingUp, DollarSign } from 'lucide-react'

export function ROICalculator() {
  // State management for three input sliders with updated default values
  const [numMedicos, setNumMedicos] = useState(1)
  const [pacientesPorDia, setPacientesPorDia] = useState(35)
  const [valorConsulta, setValorConsulta] = useState(20000)

  // Currency formatter using Intl.NumberFormat for Colombian pesos
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Memoized calculations to prevent unnecessary recalculations
  const calculations = useMemo(() => {
    const daysPerMonth = 24
    const costPerNote = 755
    const minutesSavedPerConsult = 5

    // 1. Calculate time saved
    const minutesSavedPerDay =
      numMedicos * pacientesPorDia * minutesSavedPerConsult
    const minutesSavedPerMonth = minutesSavedPerDay * daysPerMonth
    const hoursSavedPerDay = minutesSavedPerDay / 60
    const hoursSavedPerMonth = minutesSavedPerMonth / 60

    // 2. Calculate extra consults possible with saved time
    const averageConsultDuration = 20 // minutes
    const consultsExtraPerMonth = Math.floor(
      minutesSavedPerMonth / averageConsultDuration,
    )

    // 3. Calculate revenue from extra consults
    const monthlyRevenue = consultsExtraPerMonth * valorConsulta
    const annualRevenue = monthlyRevenue * 12

    // 4. Calculate costs (IMPORTANT: cost is for ALL notes, not just base)
    const baseNotes = numMedicos * pacientesPorDia * daysPerMonth
    const totalNotesPerMonth = baseNotes + consultsExtraPerMonth
    const totalNotesPerYear = totalNotesPerMonth * 12
    const annualCost = totalNotesPerYear * costPerNote

    // 5. ROI as multiplier (not percentage)
    const roiValue =
      annualCost > 0 ? (annualRevenue / annualCost).toFixed(1) : '0.0'

    return {
      hoursSavedPerDay: hoursSavedPerDay.toFixed(1),
      hoursSavedPerMonth: hoursSavedPerMonth.toFixed(0),
      consultsExtraPerMonth: consultsExtraPerMonth,
      monthlyRevenue: monthlyRevenue,
      annualRevenue: annualRevenue,
      annualCost: annualCost,
      roiValue: roiValue,
    }
  }, [numMedicos, pacientesPorDia, valorConsulta])

  return (
    <section
      id='impacto'
      className='relative py-32 lg:py-40 overflow-hidden bg-linear-to-b from-slate-900 via-slate-800 to-slate-900'
    >
      {/* Background effects - subtle dark theme */}
      <div className='absolute inset-0 overflow-hidden pointer-events-none opacity-10'>
        <div className='absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-purple-500 rounded-full blur-[120px]'></div>
        <div className='absolute bottom-[10%] left-[-10%] w-[600px] h-[600px] bg-cyan-500 rounded-full blur-[120px]'></div>
      </div>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10'>
        {/* Header section with icon, title, and subtitle */}
        <div className='text-center mb-12 sm:mb-16'>
          <div className='flex items-center justify-center gap-3 mb-6'>
            <div className='p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20'>
              <Calculator
                className='w-6 h-6 text-cyan-400'
                aria-hidden='true'
              />
            </div>
            <h2 className='text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight'>
              Calculadora de Impacto
            </h2>
          </div>
          <p className='text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed'>
            Simule el retorno de inversión financiero directo, ingresando su
            capacidad actual.
          </p>
        </div>

        {/* Input controls - compact horizontal layout */}
        <div className='mb-12 sm:mb-16'>
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12 max-w-5xl mx-auto'>
            {/* Slider 1: Number of doctors */}
            <div className='space-y-3'>
              <label
                htmlFor='num-medicos'
                className='block text-xs font-semibold text-slate-400 uppercase tracking-wider text-center'
              >
                Médicos
              </label>
              <div className='text-center'>
                <span className='text-4xl font-bold text-white'>
                  {numMedicos}
                </span>
              </div>
              <input
                id='num-medicos'
                type='range'
                min='1'
                max='50'
                step='1'
                value={numMedicos}
                onChange={(e) => setNumMedicos(Number(e.target.value))}
                className='w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-cyan'
                aria-label='Número de médicos'
                style={{
                  background: `linear-gradient(to right, rgb(34 211 238) 0%, rgb(34 211 238) ${((numMedicos - 1) / 49) * 100}%, rgb(51 65 85) ${((numMedicos - 1) / 49) * 100}%, rgb(51 65 85) 100%)`,
                }}
              />
            </div>

            {/* Slider 2: Patients per day */}
            <div className='space-y-3'>
              <label
                htmlFor='pacientes-dia'
                className='block text-xs font-semibold text-slate-400 uppercase tracking-wider text-center'
              >
                Pacientes/Día
              </label>
              <div className='text-center'>
                <span className='text-4xl font-bold text-white'>
                  {pacientesPorDia}
                </span>
              </div>
              <input
                id='pacientes-dia'
                type='range'
                min='10'
                max='50'
                step='1'
                value={pacientesPorDia}
                onChange={(e) => setPacientesPorDia(Number(e.target.value))}
                className='w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-purple'
                aria-label='Pacientes por día'
                style={{
                  background: `linear-gradient(to right, rgb(168 85 247) 0%, rgb(168 85 247) ${((pacientesPorDia - 10) / 40) * 100}%, rgb(51 65 85) ${((pacientesPorDia - 10) / 40) * 100}%, rgb(51 65 85) 100%)`,
                }}
              />
            </div>

            {/* Slider 3: Consultation value */}
            <div className='space-y-3'>
              <label
                htmlFor='valor-consulta'
                className='block text-xs font-semibold text-slate-400 uppercase tracking-wider text-center'
              >
                Valor Consulta
              </label>
              <div className='text-center'>
                <span className='text-4xl font-bold text-white'>
                  {formatCurrency(valorConsulta)}
                </span>
              </div>
              <input
                id='valor-consulta'
                type='range'
                min='20000'
                max='150000'
                step='5000'
                value={valorConsulta}
                onChange={(e) => setValorConsulta(Number(e.target.value))}
                className='w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-orange'
                aria-label='Valor de consulta'
                style={{
                  background: `linear-gradient(to right, rgb(251 146 60) 0%, rgb(251 146 60) ${((valorConsulta - 20000) / 130000) * 100}%, rgb(51 65 85) ${((valorConsulta - 20000) / 130000) * 100}%, rgb(51 65 85) 100%)`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Results grid - 2x2 on desktop, stacked on mobile */}
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-5xl mx-auto mb-8'>
          {/* Result 1: Time saved - Cyan theme */}
          <div className='relative group'>
            <div className='absolute inset-0 bg-linear-to-br from-cyan-500/20 to-cyan-600/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300'></div>
            <div className='relative bg-slate-800/60 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 hover:border-cyan-500/30 transition-all duration-300'>
              <div className='flex items-center gap-3 mb-6'>
                <div className='p-2.5 bg-cyan-500/10 rounded-xl border border-cyan-500/20'>
                  <Clock className='w-5 h-5 text-cyan-400' aria-hidden='true' />
                </div>
                <h3 className='text-xs font-bold text-cyan-400 uppercase tracking-wider'>
                  Eficiencia
                </h3>
              </div>
              <p className='text-5xl font-bold text-white mb-2'>
                {calculations.hoursSavedPerMonth}
                <span className='text-2xl text-slate-400 ml-1'>h</span>
              </p>
              <p className='text-sm text-slate-400 font-medium mb-4'>
                Ahorradas mensualmente
              </p>
              <div className='pt-4 border-t border-slate-700/50'>
                <p className='text-xs text-slate-500'>
                  Por médico diario{' '}
                  <span className='text-slate-300 font-semibold'>
                    {calculations.hoursSavedPerDay} h
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Result 2: Extra consults - Purple theme */}
          <div className='relative group'>
            <div className='absolute inset-0 bg-linear-to-br from-purple-500/20 to-purple-600/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300'></div>
            <div className='relative bg-slate-800/60 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 hover:border-purple-500/30 transition-all duration-300'>
              <div className='flex items-center gap-3 mb-6'>
                <div className='p-2.5 bg-purple-500/10 rounded-xl border border-purple-500/20'>
                  <TrendingUp
                    className='w-5 h-5 text-purple-400'
                    aria-hidden='true'
                  />
                </div>
                <h3 className='text-xs font-bold text-purple-400 uppercase tracking-wider'>
                  Crecimiento
                </h3>
              </div>
              <p className='text-5xl font-bold text-white mb-2'>
                +{calculations.consultsExtraPerMonth}
              </p>
              <p className='text-sm text-slate-400 font-medium mb-4'>
                Consultas adicionales / mes
              </p>
              <div className='pt-4 border-t border-slate-700/50'>
                <p className='text-xs text-slate-500'>
                  Se convierte tiempo ahorrado en{' '}
                  <span className='text-slate-300 font-semibold'>atención</span>
                </p>
              </div>
            </div>
          </div>

          {/* Result 3: Annual revenue - Orange theme */}
          <div className='relative group'>
            <div className='absolute inset-0 bg-linear-to-br from-orange-500/20 to-orange-600/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300'></div>
            <div className='relative bg-slate-800/60 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 hover:border-orange-500/30 transition-all duration-300'>
              <div className='flex items-center gap-3 mb-6'>
                <div className='p-2.5 bg-orange-500/10 rounded-xl border border-orange-500/20'>
                  <DollarSign
                    className='w-5 h-5 text-orange-400'
                    aria-hidden='true'
                  />
                </div>
                <h3 className='text-xs font-bold text-orange-400 uppercase tracking-wider'>
                  Rentabilidad
                </h3>
              </div>
              <p className='text-4xl font-bold text-white mb-2'>
                {formatCurrency(calculations.annualRevenue)}
              </p>
              <p className='text-sm text-slate-400 font-medium mb-4'>
                Ingreso adicional anual
              </p>
              <div className='pt-4 border-t border-slate-700/50'>
                <p className='text-xs text-slate-500'>
                  Ingreso mensual{' '}
                  <span className='text-slate-300 font-semibold'>
                    {formatCurrency(calculations.monthlyRevenue)}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Result 4: ROI - Green theme */}
          <div className='relative group'>
            <div className='absolute inset-0 bg-linear-to-br from-green-500/20 to-green-600/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300'></div>
            <div className='relative bg-slate-800/60 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 hover:border-green-500/30 transition-all duration-300'>
              <div className='flex items-center gap-3 mb-6'>
                <div className='p-2.5 bg-green-500/10 rounded-xl border border-green-500/20'>
                  <Calculator
                    className='w-5 h-5 text-green-400'
                    aria-hidden='true'
                  />
                </div>
                <h3 className='text-xs font-bold text-green-400 uppercase tracking-wider'>
                  Retorno
                </h3>
              </div>
              <p className='text-5xl font-bold text-white mb-2'>
                {calculations.roiValue}
                <span className='text-2xl text-slate-400 ml-1'>x</span>
              </p>
              <p className='text-sm text-slate-400 font-medium mb-4'>
                Multiplicador de inversión
              </p>
              <div className='pt-4 border-t border-slate-700/50'>
                <p className='text-xs text-slate-500'>
                  Inversión anual{' '}
                  <span className='text-slate-300 font-semibold'>
                    {formatCurrency(calculations.annualCost)}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div className='max-w-5xl mx-auto'>
          <div className='bg-slate-800/40 backdrop-blur-sm rounded-xl p-6 border border-slate-700/30'>
            <p className='text-xs text-slate-400 text-center leading-relaxed'>
              *Cálculos basados en 5 minutos ahorrados por paciente, 24 días
              laborales por mes, y $755 por nota generada.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
