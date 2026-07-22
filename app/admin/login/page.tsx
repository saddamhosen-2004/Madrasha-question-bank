'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !authData.user) {
      toast.error('ইমেইল বা পাসওয়ার্ড সঠিক নয়')
      setLoading(false)
      return
    }

    // Verify admin
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id')
      .eq('auth_user_id', authData.user.id)
      .single()

    if (!adminUser) {
      await supabase.auth.signOut()
      toast.error('আপনি অ্যাডমিন নন')
      setLoading(false)
      return
    }

    toast.success('অ্যাডমিন লগইন সফল!')
    router.push('/admin')
    router.refresh()
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0d2818 0%, #124d2c 50%, #1a6b3c 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
        overflow: 'hidden',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #0d2818, #1a6b3c)',
          padding: '32px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🔐</div>
          <h1 style={{ color: 'white', fontSize: '1.2rem', fontWeight: 700, marginBottom: '4px' }}>
            Super Admin Panel
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem' }}>
            অ্যাডমিন অ্যাকাউন্টে লগইন করুন
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ padding: '28px 32px 32px' }}>
          <div className="form-group">
            <label className="label">অ্যাডমিন ইমেইল</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              id="admin-email"
              placeholder="admin@madrasha.com"
            />
          </div>

          <div className="form-group">
            <label className="label">পাসওয়ার্ড</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              id="admin-password"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '13px' }}
            id="admin-login-submit"
          >
            {loading ? <><div className="spinner" /> লগইন হচ্ছে...</> : 'অ্যাডমিন লগইন'}
          </button>
        </form>
      </div>
    </div>
  )
}
