import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import '@/styles/globals.css'

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Clinicalops',
  description:
    'Asistente con inteligencia artificial para generar historias clínicas',
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
