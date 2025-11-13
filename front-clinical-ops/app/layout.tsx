import type { Metadata } from 'next'
import './globals.css'
import { AppProvider } from './provider'

export const metadata: Metadata = {
  title: 'ClinicalOps - Historias Clínicas con IA',
  description:
    'Plataforma de inteligencia artificial para generar historias clínicas detalladas, precisas y estructuradas en minutos.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en'>
      <body className='font-sans antialiased'>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  )
}
