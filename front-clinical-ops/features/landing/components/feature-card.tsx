import { LucideIcon } from 'lucide-react'

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
}: FeatureCardProps) {
  return (
    <div className='group relative bg-white p-8 border border-slate-100 rounded-2xl hover:border-purple-100 transition-all duration-500 h-full flex flex-col items-start hover:shadow-xl hover:shadow-slate-200/40'>
      {/* Accent bar */}
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
  )
}
