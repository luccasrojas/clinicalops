import { cn } from '@/lib/utils'

interface SectionBadgeProps {
  children: React.ReactNode
  className?: string
  icon?: React.ReactNode
}

export function SectionBadge({ children, className, icon }: SectionBadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white border border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-widest shadow-sm',
        className,
      )}
    >
      {icon}
      <span>{children}</span>
    </div>
  )
}
