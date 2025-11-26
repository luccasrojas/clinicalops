import { LucideIcon } from 'lucide-react'

interface ProblemCardProps {
  icon: LucideIcon
  title: string
  description: string
  gradientFrom: string
  gradientTo: string
}

export function ProblemCard({
  icon: Icon,
  title,
  description,
  gradientFrom,
  gradientTo,
}: ProblemCardProps) {
  return (
    <div className='group relative p-px rounded-[2rem] overflow-hidden transition-all duration-500 hover:-translate-y-1'>
      {/* Background gradient */}
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
  )
}
