'use client'

import { Settings } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ConfiguracionPage() {
  return (
    <div className='container mx-auto py-4 px-4 sm:py-6 sm:px-6 lg:py-8 lg:px-8'>
      <div className='space-y-4 sm:space-y-6'>
        <div>
          <h1 className='text-2xl sm:text-3xl font-bold'>Configuración</h1>
          <p className='text-muted-foreground mt-1 text-sm sm:text-base'>
            Administra tu cuenta y preferencias
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center text-base sm:text-lg'>
              <Settings className='w-4 h-4 sm:w-5 sm:h-5 mr-2' />
              En Desarrollo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-muted-foreground text-sm sm:text-base'>
              Esta sección está actualmente en desarrollo. Pronto podrás
              configurar tus preferencias y administrar tu cuenta desde aquí.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
