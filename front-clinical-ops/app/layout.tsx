import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import '@/styles/globals.css'

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
})

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
      <body className={`${montserrat.variable} antialiased`}>{children}</body>
    </html>
  )
}
