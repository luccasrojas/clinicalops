'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { paths } from '@/config/paths'

const navItems = [
  { href: paths.sections.benefits, label: 'Beneficios' },
  { href: paths.sections.howItWorks, label: 'Funcionamiento' },
  { href: paths.sections.testimonials, label: 'Testimonios' },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className='sticky top-0 z-50 w-full bg-background/80 backdrop-blur-sm border-b'>
      <div className='px-4 md:px-10 lg:px-20 mx-auto max-w-7xl'>
        <div className='flex items-center justify-between h-16'>
          <Link
            href={paths.home.getHref()}
            className='flex items-center gap-2 text-foreground'
          >
            <Image
              src='/LogoClinicalops.png'
              alt='ClinicalOps Logo'
              width={32}
              height={32}
              className='size-8'
            />
            <h2 className='text-lg font-bold leading-tight'>ClinicalOps</h2>
          </Link>

          {/* Desktop Navigation */}
          <nav className='hidden md:flex flex-1 justify-center items-center gap-9'>
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className='text-sm font-medium leading-normal hover:text-primary transition-colors'
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className='hidden md:flex gap-2'>
            <Button variant='ghost' size='default' asChild>
              <Link href={paths.auth.login.getHref()}>Iniciar Sesión</Link>
            </Button>
            <Button size='default' asChild>
              <Link href={paths.auth.signup.getHref()}>Registrarse Gratis</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className='md:hidden p-2'
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label='Toggle mobile menu'
          >
            {mobileMenuOpen ? (
              <X className='size-6' />
            ) : (
              <Menu className='size-6' />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className='md:hidden border-t bg-background'
          >
            <nav className='flex flex-col gap-4 p-4'>
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className='text-sm font-medium leading-normal hover:text-primary transition-colors'
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <div className='flex flex-col gap-2 pt-4 border-t'>
                <Button variant='ghost' size='default' asChild>
                  <Link href={paths.auth.login.getHref()}>Iniciar Sesión</Link>
                </Button>
                <Button size='default' asChild>
                  <Link href={paths.auth.signup.getHref()}>
                    Registrarse Gratis
                  </Link>
                </Button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
