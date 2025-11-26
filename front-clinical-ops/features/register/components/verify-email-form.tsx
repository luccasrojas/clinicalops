'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, CheckCircle2 } from 'lucide-react'
import { invokeLambdaApi } from '@/lib/lambda-api'

interface VerifyEmailFormProps {
  email: string
  onVerified: () => void
}

export function VerifyEmailForm({ email, onVerified }: VerifyEmailFormProps) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await invokeLambdaApi({
        functionName: 'auth_verify_email',
        payload: {
          email,
          code: code.trim(),
        },
      })
      setSuccess(true)
      setTimeout(() => {
        onVerified()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className='w-full max-w-md'>
      <CardHeader className='text-center'>
        <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100'>
          <Mail className='h-6 w-6 text-blue-600' />
        </div>
        <CardTitle>Verifica tu correo</CardTitle>
        <CardDescription>
          Hemos enviado un código de verificación a <strong>{email}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='code'>Código de verificación</Label>
            <Input
              id='code'
              type='text'
              placeholder='123456'
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={loading || success}
              maxLength={6}
              className='text-center text-2xl tracking-widest'
              required
            />
          </div>

          {error && (
            <Alert variant='destructive'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className='bg-green-50 border-green-200'>
              <CheckCircle2 className='h-4 w-4 text-green-600' />
              <AlertDescription className='text-green-800'>
                ¡Email verificado exitosamente! Redirigiendo...
              </AlertDescription>
            </Alert>
          )}

          <Button type='submit' className='w-full' disabled={loading || success}>
            {loading ? 'Verificando...' : 'Verificar código'}
          </Button>

          <p className='text-center text-sm text-muted-foreground'>
            ¿No recibiste el código?{' '}
            <button
              type='button'
              className='text-blue-600 hover:underline'
              onClick={() => {
                // TODO: Implementar reenvío de código
                alert('Funcionalidad de reenvío próximamente')
              }}
            >
              Reenviar
            </button>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
