'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })

    if (error) {
      setError('Usuário ou senha inválidos.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--beige)' }}>
      <div className="w-full max-w-sm card p-0 overflow-hidden">
        {/* Logo */}
        <div className="flex items-center gap-3 p-6 pb-4">
          <div
            className="flex items-center justify-center"
            style={{
              width: 36,
              height: 36,
              background: 'var(--yellow)',
              border: '2px solid var(--black)',
              fontWeight: 900,
              fontSize: 20,
            }}
          >
            H
          </div>
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.01em' }}>Hist2025.2</span>
        </div>

        {/* Red stripe */}
        <div style={{ height: 3, background: 'var(--red)' }} />

        {/* Black separator */}
        <div style={{ height: 2, background: 'var(--black)' }} />

        <form onSubmit={handleLogin} className="p-6 flex flex-col gap-4">
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="label">Senha</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p style={{ color: 'var(--red)', fontSize: 13, fontWeight: 600 }}>{error}</p>
          )}

          <button
            type="submit"
            className="btn-primary w-full justify-center"
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          <p style={{ fontSize: 13, color: 'var(--gray)', textAlign: 'center' }}>
            Não tem conta?{' '}
            <Link href="/register" style={{ color: 'var(--blue)', fontWeight: 700 }}>
              Cadastre-se
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
