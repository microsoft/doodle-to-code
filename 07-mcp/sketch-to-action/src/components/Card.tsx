import type { PropsWithChildren } from 'react'

export interface CardProps {
  title?: string
  description?: string
}

export function Card({ title, description, children }: PropsWithChildren<CardProps>) {
  return (
    <article className="sketch-card">
      {title ? <h3 className="sketch-card__title">{title}</h3> : null}
      {description ? (
        <p className="sketch-card__description">{description}</p>
      ) : null}
      {children ? <div className="sketch-card__content">{children}</div> : null}
    </article>
  )
}
