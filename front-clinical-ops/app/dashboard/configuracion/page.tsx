'use client';

import { Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ConfiguracionPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Configuración</h1>
          <p className="text-muted-foreground mt-1">
            Administra tu cuenta y preferencias
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              En Desarrollo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Esta sección está actualmente en desarrollo. Pronto podrás configurar
              tus preferencias y administrar tu cuenta desde aquí.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
