import type { ButtonHTMLAttributes } from 'react'

export interface ButtonProps {
  label: string
  variant?: 'primary' | 'secondary'
  type?: ButtonHTMLAttributes<HTMLButtonElement>['type']
}

export function Button({ label, variant = 'primary', type = 'button' }: ButtonProps) {
  return (
    <button className={`sketch-button sketch-button--${variant}`} type={type}>
      {label}
    </button>
  )
}
