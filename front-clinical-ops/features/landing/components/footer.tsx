import Link from 'next/link'
import Image from 'next/image'

export function Footer() {
  return (
    <footer className='bg-muted/50 border-t'>
      <div className='px-4 md:px-10 lg:px-20 py-8 mx-auto max-w-7xl flex flex-col md:flex-row justify-between items-center gap-4'>
        <div className='flex items-center gap-2'>
          <Image
            src='/LogoClinicalops.png'
            alt='ClinicalOps Logo'
            width={24}
            height={24}
            className='size-6'
          />
          <p className='text-sm font-semibold'>ClinicalOps</p>
        </div>
        <p className='text-sm text-muted-foreground'>
          © 2025 ClinicalOps. Todos los derechos reservados.
        </p>
        <div className='flex gap-4'>
          <Link
            href='#'
            className='text-sm text-muted-foreground hover:text-primary transition-colors'
          >
            Términos
          </Link>
          <Link
            href='#'
            className='text-sm text-muted-foreground hover:text-primary transition-colors'
          >
            Privacidad
          </Link>
        </div>
      </div>
    </footer>
  )
}
