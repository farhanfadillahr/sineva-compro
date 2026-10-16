/** Temporary admin-only native bridge. Replace imports with CPR-26 primitives once merged. */
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'
import s from './admin.module.css'
export function AdminButton({tone='secondary',className='',...props}:ButtonHTMLAttributes<HTMLButtonElement>&{tone?:'primary'|'secondary'|'danger'}){return <button type="button" {...props} className={`${s.button} ${tone==='primary'?s.primary:tone==='danger'?s.danger:''} ${className}`}/>}
export function AdminInput(props:InputHTMLAttributes<HTMLInputElement>){return <input {...props} className={`${s.input} ${props.className??''}`}/>}
export function Badge({children,tone='brand'}:{children:ReactNode;tone?:'brand'|'success'|'warning'|'danger'}){return <span className={s.badge} data-tone={tone}>{children}</span>}
