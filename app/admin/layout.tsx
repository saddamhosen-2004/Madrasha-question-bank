'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { 
  LayoutDashboard, 
  GraduationCap, 
  BookOpen, 
  Layers, 
  HelpCircle, 
  UploadCloud, 
  School, 
  CreditCard, 
  LogOut,
  Menu,
  X
} from 'lucide-react'

const navItems = [
  { href: '/admin', label: 'ড্যাশবোর্ড', icon: LayoutDashboard, exact: true },
  { label: '—— কন্টেন্ট ——', section: true },
  { href: '/admin/jamat', label: 'জামাত', icon: GraduationCap },
  { href: '/admin/kitab', label: 'কিতাব', icon: BookOpen },
  { href: '/admin/chapter', label: 'চ্যাপ্টার', icon: Layers },
  { href: '/admin/questions', label: 'প্রশ্নসমূহ', icon: HelpCircle },
  { href: '/admin/questions/bulk-import', label: 'Bulk Import', icon: UploadCloud },
  { label: '—— ব্যবস্থাপনা ——', section: true },
  { href: '/admin/institutions', label: 'প্রতিষ্ঠানসমূহ', icon: School },
  { href: '/admin/payments', label: 'পেমেন্ট যাচাই', icon: CreditCard },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (pathname === '/admin/login') return <>{children}</>

  // Close sidebar on pathname change
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('লগআউট সফল')
    window.location.href = '/admin/login'
  }

  function isActive(item: { href?: string; exact?: boolean }) {
    if (!item.href) return false
    if (item.exact) return pathname === item.href
    return pathname.startsWith(item.href)
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
        <div className="badge badge-warning" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>অ্যাডমিন প্যানেল</div>
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
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} style={{ zIndex: 100 }}>
          <div className="sidebar-logo">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.2rem',
                color: 'white'
              }}>📚</div>
              <div>
                <div style={{ color: 'white', fontWeight: 700, fontSize: '0.88rem' }}>মাদ্রাসা প্রশ্নব্যাংক</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>Super Admin</div>
              </div>
            </div>
          </div>

          <nav className="sidebar-nav" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ flex: 1 }}>
              {navItems.map((item, i) => {
                if (item.section) {
                  return (
                    <div key={i} className="sidebar-section-title" style={{ marginTop: '8px' }}>{item.label}</div>
                  )
                }
                const IconComponent = item.icon!
                const active = isActive(item)
                return (
                  <Link
                    key={item.href}
                    href={item.href!}
                    className={`sidebar-item ${active ? 'active' : ''}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <IconComponent style={{ width: '18px', height: '18px' }} />
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
                id="admin-logout"
              >
                <LogOut style={{ width: '18px', height: '18px', color: '#fca5a5' }} />
                <span style={{ color: '#fca5a5' }}>লগআউট</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* Main content */}
        <main className="main-content" style={{ flex: 1 }}>
          <div style={{ padding: '28px', minHeight: '100vh' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
