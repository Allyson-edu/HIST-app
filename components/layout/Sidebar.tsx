'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Calendar,
  Target,
  Menu,
  X,
  LogOut,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
}

const mainNav: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
  { href: '/semesters', label: 'Semestres', icon: <GraduationCap size={16} /> },
  { href: '/subjects', label: 'Disciplinas', icon: <BookOpen size={16} /> },
]

const toolsNav: NavItem[] = [
  { href: '/activities', label: 'Atividades', icon: <Target size={16} /> },
  { href: '/calendar', label: 'Calendário', icon: <Calendar size={16} /> },
]

interface SidebarProps {
  username?: string
}

export default function Sidebar({ username }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function NavLink({ item }: { item: NavItem }) {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
    return (
      <Link
        href={item.href}
        className={`nav-item${isActive ? ' active' : ''}`}
        onClick={() => setMobileOpen(false)}
      >
        {item.icon}
        {item.label}
      </Link>
    )
  }

  const sidebarContent = (
    <div className="sidebar-glass flex flex-col h-full w-56">
      {/* Logo */}
      <div className="flex items-center gap-3 p-4">
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{
            width: 32,
            height: 32,
            background: 'var(--yellow)',
            border: '2px solid var(--black)',
            fontWeight: 900,
            fontSize: 18,
          }}
        >
          H
        </div>
        <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.01em' }}>Hist2025.2</span>
      </div>

      {/* Red stripe */}
      <div style={{ height: 3, background: 'var(--red)' }} />
      {/* Black separator */}
      <div style={{ height: 2, background: 'var(--black)' }} />

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        <p className="section-title mt-2 mb-1">PRINCIPAL</p>
        {mainNav.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}

        <p className="section-title mt-4 mb-1">FERRAMENTAS</p>
        {toolsNav.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>

      {/* Bottom: user info + logout */}
      <div style={{ borderTop: '2px solid var(--black)', padding: '12px' }}>
        {username && (
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray)', marginBottom: 8 }}>
            @{username}
          </p>
        )}
        <button
          onClick={handleSignOut}
          className="btn-secondary"
          style={{ width: '100%', fontSize: 12, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <LogOut size={14} />
          Sair
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:block fixed left-0 top-0 h-full w-56 z-40">
        {sidebarContent}
      </div>

      {/* Mobile hamburger */}
      <button
        className="fixed top-3 left-3 z-50 md:hidden"
        style={{
          background: 'var(--black)',
          color: '#fff',
          border: '2px solid var(--black)',
          padding: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={() => setMobileOpen((v) => !v)}
        aria-label="Menu"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className="fixed left-0 top-0 h-full z-50 md:hidden"
        style={{
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.2s ease',
          width: 224,
        }}
      >
        {sidebarContent}
      </div>
    </>
  )
}
