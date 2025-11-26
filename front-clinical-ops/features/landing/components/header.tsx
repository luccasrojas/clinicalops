'use client'

import { useState, useEffect } from 'react'
import { Menu, X, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { NAV_LINKS } from '../constants/landing-data'

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleNavClick = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <nav
      className={cn(
        'fixed w-full z-50 transition-all duration-500 border-b',
        isScrolled
          ? 'bg-white/90 backdrop-blur-xl border-slate-100 py-4'
          : 'bg-transparent border-transparent py-6',
      )}
      role='navigation'
      aria-label='Main navigation'
    >
      <div className='max-w-7xl mx-auto px-6 lg:px-8 flex justify-between items-center'>
        {/* Logo */}
        <div className='flex items-center gap-3 group cursor-default'>
          <div className='w-10 h-10 bg-[#0F172A] rounded-xl flex items-center justify-center shadow-md ring-1 ring-slate-900/5 transition-transform group-hover:scale-105 duration-300'>
            <Activity
              className='text-white w-5 h-5 stroke-[2.5]'
              aria-hidden='true'
            />
          </div>
          <span className='font-bold text-xl tracking-tight text-slate-900'>
            ClinicalOps<span className='text-[#7C3AED]'>.AI</span>
          </span>
        </div>

        {/* Desktop Navigation */}
        <div className='hidden md:flex items-center gap-10'>
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className='text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors tracking-tight'
            >
              {link.label}
            </a>
          ))}
          <Button
            variant='primary'
            className='py-2.5 px-5 text-xs uppercase tracking-wider font-bold shadow-none hover:shadow-md'
          >
            Prueba ClinicalNotes
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className='md:hidden text-slate-900'
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? (
            <X strokeWidth={1.5} aria-hidden='true' />
          ) : (
            <Menu strokeWidth={1.5} aria-hidden='true' />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className='md:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-xl shadow-xl border-t border-slate-100 py-8 px-6 flex flex-col gap-6 animate-in slide-in-from-top-5'>
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className='text-slate-900 font-semibold text-lg'
              onClick={handleNavClick}
            >
              {link.label}
            </a>
          ))}
          <Button variant='gradient' className='w-full justify-center mt-2'>
            Prueba ClinicalNotes
          </Button>
        </div>
      )}
    </nav>
  )
}
