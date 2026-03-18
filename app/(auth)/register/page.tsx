'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    if (username.includes(' ')) {
      setError('Usuário não pode conter espaços.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const cleanUsername = username.trim().toLowerCase()

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { username: cleanUsername, full_name: fullName.trim() },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        user_id: data.user.id,
        username: cleanUsername,
        full_name: fullName.trim() || null,
      })

      if (profileError) {
        console.error('Profile insert error:', profileError)
      }
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

        <form onSubmit={handleRegister} className="p-6 flex flex-col gap-4">
          <div>
            <label className="label">Nome Completo</label>
            <input
              className="input"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Seu nome completo"
              autoComplete="name"
            />
          </div>

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
            <label className="label">Usuário</label>
            <input
              className="input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
              placeholder="sem_espacos"
              required
              autoComplete="username"
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
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="label">Confirmar Senha</label>
            <input
              className="input"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="new-password"
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
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </button>

          <p style={{ fontSize: 13, color: 'var(--gray)', textAlign: 'center' }}>
            Já tem conta?{' '}
            <Link href="/login" style={{ color: 'var(--blue)', fontWeight: 700 }}>
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
