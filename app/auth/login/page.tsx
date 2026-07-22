'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast.error('ইমেইল বা পাসওয়ার্ড সঠিক নয়')
      setLoading(false)
      return
    }

    toast.success('লগইন সফল হয়েছে!')
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0d4022 0%, #1a6b3c 60%, #2a8a50 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1a6b3c, #2a8a50)',
          padding: '32px 32px 28px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📚</div>
          <h1 style={{ color: 'white', fontSize: '1.3rem', fontWeight: 700, marginBottom: '4px' }}>
            মাদ্রাসা প্রশ্নব্যাংক
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem' }}>
            আপনার অ্যাকাউন্টে লগইন করুন
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} style={{ padding: '28px 32px 32px' }}>
          <div className="form-group">
            <label className="label">ইমেইল ঠিকানা</label>
            <input
              type="email"
              className="input"
              placeholder="example@gmail.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              id="login-email"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="label">পাসওয়ার্ড</label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              id="login-password"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: '8px', padding: '13px' }}
            id="login-submit"
          >
            {loading ? (
              <><div className="spinner" /> লগইন হচ্ছে...</>
            ) : 'লগইন করুন'}
          </button>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            অ্যাকাউন্ট নেই?{' '}
            <Link href="/auth/register" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
              নিবন্ধন করুন
            </Link>
          </p>

          <p style={{ textAlign: 'center', marginTop: '8px' }}>
            <Link href="/" style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', textDecoration: 'none' }}>
              ← হোমে ফিরুন
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
