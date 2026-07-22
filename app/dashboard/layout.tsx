'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { LayoutDashboard, PenTool, Zap, History, CreditCard, User, LogOut, Menu, X } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
  { href: '/dashboard/create', label: 'প্রশ্নপত্র তৈরি (Manual)', icon: PenTool },
  { href: '/dashboard/auto-generate', label: 'Auto Generate', icon: Zap },
  { href: '/dashboard/papers', label: 'পেপার হিস্টরি', icon: History },
  { href: '/dashboard/subscription', label: 'সাবস্ক্রিপশন', icon: CreditCard },
  { href: '/dashboard/profile', label: 'প্রোফাইল', icon: User },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const supabase = createClient()
  const [institution, setInstitution] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/auth/login'
        return
      }
      const { data: inst } = await supabase
        .from('institutions')
        .select('*')
        .eq('auth_user_id', user.id)
        .single()
      
      setInstitution(inst)
      setLoading(false)
    }
    loadUser()
  }, [])

  // Close sidebar on path changes (e.g. mobile navigation)
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('সফলভাবে লগআউট হয়েছে')
    window.location.href = '/auth/login'
  }

  if (pathname === '/dashboard/login' || pathname?.startsWith('/auth')) {
    return <>{children}</>
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa' }}>
        <div className="spinner spinner-dark" />
      </div>
    )
  }

  const getSubBadge = () => {
    if (!institution) return null
    if (institution.subscription_status === 'trial') {
      return <span className="badge badge-info" style={{ fontSize: '0.75rem', padding: '3px 8px' }}>ট্রায়াল চলছে</span>
    }
    if (institution.subscription_status === 'active') {
      return <span className="badge badge-success" style={{ fontSize: '0.75rem', padding: '3px 8px' }}>সক্রিয়</span>
    }
    if (institution.subscription_status === 'blocked') {
      return <span className="badge badge-danger" style={{ fontSize: '0.75rem', padding: '3px 8px' }}>ব্লকড</span>
    }
    return <span className="badge badge-danger" style={{ fontSize: '0.75rem', padding: '3px 8px' }}>মেয়াদোত্তীর্ণ</span>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Mobile Header Bar */}
      <header className="mobile-header" style={{
        display: 'none',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 18px',
        background: 'var(--color-primary-dark)',
        color: 'white',
        position: 'sticky',
        top: 0,
        zIndex: 90,
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
          >
            {sidebarOpen ? <X style={{ width: '24px', height: '24px' }} /> : <Menu style={{ width: '24px', height: '24px' }} />}
          </button>
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>মাদ্রাসা প্রশ্নব্যাংক</span>
        </div>
        <div className="badge badge-success" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>ইউজার প্যানেল</div>
      </header>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Mobile Sidebar backdrop overlay */}
        {sidebarOpen && (
          <div 
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(3px)',
              zIndex: 95,
            }}
          />
        )}

        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-logo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '24px 20px' }}>
            {institution?.logo_url ? (
              <img src={institution.logo_url} alt="Logo" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.2)' }} />
            ) : (
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.5rem' }}>
                {institution?.name?.charAt(0) || 'I'}
              </div>
            )}
            <h2 style={{ color: 'white', fontWeight: 600, fontSize: '0.9rem', textAlign: 'center', marginTop: '6px' }}>{institution?.name || 'প্রতিষ্ঠান'}</h2>
            <div style={{ marginTop: '4px' }}>{getSubBadge()}</div>
          </div>

          <nav className="sidebar-nav" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ flex: 1 }}>
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sidebar-item ${isActive ? 'active' : ''}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon style={{ width: '18px', height: '18px' }} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>

            <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 'auto', marginBottom: '24px' }}>
              <button
                onClick={handleLogout}
                className="sidebar-item"
                style={{ width: '100%', border: 'none', cursor: 'pointer', background: 'transparent', display: 'flex', alignItems: 'center', gap: '12px' }}
              >
                <LogOut style={{ width: '18px', height: '18px', color: '#fca5a5' }} />
                <span style={{ color: '#fca5a5' }}>লগআউট</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="main-content" style={{ flex: 1 }}>
          <div style={{ padding: '28px', minHeight: '100vh' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
