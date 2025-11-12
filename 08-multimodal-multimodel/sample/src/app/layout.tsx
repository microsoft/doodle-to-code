import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Decision Engine Explorer',
  description: 'Learn multimodal and multimodel AI concepts through interactive visualization',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
