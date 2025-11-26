'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-300 active:scale-95 disabled:pointer-events-none disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 motion-reduce:transition-none motion-reduce:active:scale-100',
  {
    variants: {
      variant: {
        default:
          'bg-[#0F172A] text-white hover:bg-[#1E293B] shadow-lg shadow-slate-900/20 border border-slate-800',
        primary:
          'bg-[#0F172A] text-white hover:bg-[#1E293B] shadow-lg shadow-slate-900/20 border border-slate-800',
        secondary:
          'bg-white text-slate-900 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-sm',
        outline:
          'bg-transparent text-slate-900 border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50',
        destructive:
          'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-900/20 border border-red-700',
        gradient:
          'bg-gradient-to-r from-cyan-600 to-purple-600 text-white hover:shadow-lg hover:shadow-purple-500/25 border-none',
        ghost: 'text-slate-600 hover:text-slate-900 hover:bg-slate-50',
        link: 'text-cyan-600 underline-offset-4 hover:underline',
      },
      size: {
        default: 'px-8 py-3.5 text-sm',
        sm: 'px-5 py-2.5 text-xs',
        lg: 'px-10 py-4 text-base',
        icon: 'p-3',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'
