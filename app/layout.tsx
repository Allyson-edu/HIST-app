import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Hist2025.2 — Organizador Acadêmico',
  description: 'Gerenciador acadêmico universitário',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
