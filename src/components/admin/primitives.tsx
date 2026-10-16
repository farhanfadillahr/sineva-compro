/** Dense admin variants reuse the shared design-system primitives. */
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge as SharedBadge } from '@/components/ui/badge'
import s from './admin.module.css'

export function AdminButton({
  tone = 'secondary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'primary' | 'secondary' | 'danger' }) {
  return (
    <Button
      {...props}
      type={props.type ?? 'button'}
      variant={tone === 'primary' ? 'primary' : 'secondary'}
      size="sm"
      className={`${s.button} ${tone === 'primary' ? s.primary : tone === 'danger' ? s.danger : ''} ${className}`}
    />
  )
}
export function AdminInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <Input {...props} className={`${s.input} ${props.className ?? ''}`} />
}
export function Badge({
  children,
  tone = 'brand',
}: {
  children: ReactNode
  tone?: 'brand' | 'success' | 'warning' | 'danger'
}) {
  return (
    <SharedBadge tone={tone === 'warning' ? 'warm' : tone} className={s.badge}>
      {children}
    </SharedBadge>
  )
}
