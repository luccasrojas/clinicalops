import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'form'>) {
  return (
    <form className={cn('flex flex-col gap-6', className)} {...props}>
      <FieldGroup>
        <div className='flex flex-col items-center gap-1 text-center'>
          <h1 className='text-2xl font-bold'>Ingresa a tu cuenta</h1>
          <p className='text-muted-foreground text-sm text-balance'>
            Ingresa tu correo electrónico a continuación para iniciar sesión en
            tu cuenta
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor='email'>Email</FieldLabel>
          <Input id='email' type='email' placeholder='m@example.com' required />
        </Field>
        <Field>
          <div className='flex items-center'>
            <FieldLabel htmlFor='password'>Password</FieldLabel>
            <a
              href='#'
              className='ml-auto text-sm underline-offset-4 hover:underline'
            >
              Olvidaste tu contraseña?
            </a>
          </div>
          <Input id='password' type='password' required />
        </Field>
        <Field>
          <Button type='submit'>Login</Button>
        </Field>

        <FieldDescription className='text-center'>
          No tienes una cuenta?{' '}
          <a href='/register' className='underline underline-offset-4'>
            Regístrate
          </a>
        </FieldDescription>
      </FieldGroup>
    </form>
  )
}
