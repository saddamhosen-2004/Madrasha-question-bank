'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [siteName, setSiteName] = useState('মাদ্রাসা প্রশ্নব্যাংক')
  const [siteLogoUrl, setSiteLogoUrl] = useState<string | null>(null)

  // Forgot password states
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)

  // Load site settings (name + logo) on mount
  useEffect(() => {
    async function loadSiteSettings() {
      const supabase = createClient()
      const { data } = await supabase
        .from('site_settings')
        .select('site_name, site_logo_url')
        .eq('id', 1)
        .single()
      if (data) {
        if (data.site_name) setSiteName(data.site_name)
        if (data.site_logo_url) setSiteLogoUrl(data.site_logo_url)
      }
    }
    loadSiteSettings()
  }, [])

  async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!forgotEmail) return
    setForgotLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    setForgotLoading(false)
    if (error) {
      toast.error('রিসেট লিংক পাঠানো যায়নি: ' + error.message)
    } else {
      toast.success('রিসেট লিংক আপনার ইমেইলে পাঠানো হয়েছে!')
      setShowForgotModal(false)
      setForgotEmail('')
    }
  }

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
    <>
      <style>{`
        .login-bg {
          min-height: 100vh;
          background: linear-gradient(135deg, #052e16 0%, #0f5d34 40%, #16a34a 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          font-family: 'Hind Siliguri', 'Noto Sans Bengali', sans-serif;
          position: relative;
          overflow: hidden;
        }

        .login-bg::before {
          content: '';
          position: absolute;
          width: 300px;
          height: 300px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);
          top: -100px;
          left: -100px;
          pointer-events: none;
        }

        .login-bg::after {
          content: '';
          position: absolute;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.04);
          bottom: -150px;
          right: -100px;
          pointer-events: none;
        }

        .login-card {
          background: #ffffff;
          border-radius: 20px;
          box-shadow: 0 4px 40px rgba(0,0,0,0.10), 0 1px 6px rgba(0,0,0,0.05);
          padding: 44px 40px 36px;
          width: 100%;
          max-width: 440px;
        }

        .login-logo-wrap {
          display: flex;
          justify-content: center;
          margin-bottom: 18px;
        }

        .login-logo-icon {
          width: 66px;
          height: 66px;
          border-radius: 18px;
          background: linear-gradient(135deg, #0f9e6e, #0d7a54);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          box-shadow: 0 6px 20px rgba(15,158,110,0.35);
          overflow: hidden;
          position: relative;
        }

        .login-title {
          text-align: center;
          font-size: 1.45rem;
          font-weight: 700;
          color: #0e2015;
          margin: 0 0 6px;
          line-height: 1.4;
        }

        .login-subtitle {
          text-align: center;
          font-size: 0.85rem;
          color: #6b8c7d;
          margin: 0 0 32px;
        }

        .login-divider {
          height: 1px;
          background: #e8f0eb;
          margin-bottom: 28px;
        }

        .login-field {
          margin-bottom: 20px;
        }

        .login-label {
          display: block;
          font-size: 0.88rem;
          font-weight: 600;
          color: #2d4a35;
          margin-bottom: 8px;
        }

        .login-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .login-input-icon {
          position: absolute;
          left: 14px;
          color: #9ab8a4;
          display: flex;
          align-items: center;
          pointer-events: none;
        }

        .login-input {
          width: 100%;
          padding: 12px 14px 12px 42px;
          border: 1.5px solid #d5e5da;
          border-radius: 10px;
          font-size: 0.92rem;
          font-family: inherit;
          color: #0e2015;
          background: #f8fbf9;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          box-sizing: border-box;
        }

        .login-input:focus {
          border-color: #0f9e6e;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(15,158,110,0.12);
        }

        .login-input::placeholder {
          color: #b5cfc1;
        }

        .login-input-right-icon {
          position: absolute;
          right: 14px;
          background: none;
          border: none;
          cursor: pointer;
          color: #9ab8a4;
          display: flex;
          align-items: center;
          padding: 0;
          transition: color 0.15s;
        }

        .login-input-right-icon:hover {
          color: #0f9e6e;
        }

        .login-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #0f9e6e, #0d7a54);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 8px;
          transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
          box-shadow: 0 4px 16px rgba(15,158,110,0.35);
        }

        .login-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 22px rgba(15,158,110,0.42);
        }

        .login-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .login-spinner {
          width: 18px;
          height: 18px;
          border: 2.5px solid rgba(255,255,255,0.4);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .login-register-row {
          text-align: center;
          margin-top: 22px;
          font-size: 0.88rem;
          color: #6b8c7d;
        }

        .login-register-link {
          color: #0f9e6e;
          font-weight: 700;
          text-decoration: none;
          margin-left: 4px;
          transition: opacity 0.15s;
        }

        .login-register-link:hover {
          opacity: 0.8;
        }

        .login-footer {
          text-align: center;
          margin-top: 24px;
          font-size: 0.78rem;
          color: #5a7a67;
        }

        .login-footer a {
          color: #0f9e6e;
          text-decoration: none;
          font-weight: 600;
          transition: opacity 0.15s;
        }

        .login-footer a:hover {
          opacity: 0.8;
          text-decoration: underline;
        }

        @media (max-width: 480px) {
          .login-card {
            padding: 36px 24px 28px;
          }
        }
      `}</style>

      <div className="login-bg">
        <div className="login-card">

          {/* Logo */}
          <div className="login-logo-wrap">
            <div className="login-logo-icon">
              {siteLogoUrl ? (
                <Image
                  src={siteLogoUrl}
                  alt={siteName}
                  fill
                  style={{ objectFit: 'cover' }}
                  unoptimized
                />
              ) : (
                '📚'
              )}
            </div>
          </div>

          {/* Title */}
          <h1 className="login-title">{siteName}</h1>
          <p className="login-subtitle">আপনার প্রতিষ্ঠানের অ্যাকাউন্টে লগইন করুন</p>

          <div className="login-divider" />

          {/* Form */}
          <form onSubmit={handleLogin}>

            {/* Email */}
            <div className="login-field">
              <label className="login-label" htmlFor="login-email">ইমেইল ঠিকানা</label>
              <div className="login-input-wrap">
                <span className="login-input-icon">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <input
                  id="login-email"
                  type="email"
                  className="login-input"
                  placeholder="example@gmail.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="login-field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="login-label" htmlFor="login-password" style={{ margin: 0 }}>পাসওয়ার্ড</label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  style={{ 
                    fontSize: '0.82rem', 
                    color: '#0f9e6e', 
                    background: 'none', 
                    border: 'none', 
                    padding: 0, 
                    cursor: 'pointer', 
                    fontWeight: 600,
                    textDecoration: 'underline'
                  }}
                >
                  পাসওয়ার্ড ভুলে গেছেন?
                </button>
              </div>
              <div className="login-input-wrap">
                <span className="login-input-icon">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="login-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="login-input-right-icon"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" className="login-btn" disabled={loading} id="login-submit">
              {loading ? (
                <><div className="login-spinner" /> লগইন হচ্ছে...</>
              ) : 'লগইন করুন'}
            </button>
          </form>

          {/* Register link */}
          <p className="login-register-row">
            অ্যাকাউন্ট নেই?
            <Link href="/auth/register" className="login-register-link">
              নিবন্ধন করুন
            </Link>
          </p>

          {/* Footer */}
          <p className="login-footer">
            Developed with 💙 by <a href="https://dgtalcommerce.com" target="_blank" rel="noopener noreferrer">dgtalcommerce.com</a>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal" style={{ maxWidth: '400px', width: '100%', padding: '28px', borderRadius: '16px' }}>
            <h2 className="text-xl font-bold mb-2" style={{ margin: '0 0 8px', color: 'var(--color-text)' }}>পাসওয়ার্ড রিসেট</h2>
            <p className="text-sm text-[var(--color-text-muted)]" style={{ margin: '0 0 24px', lineHeight: '1.5' }}>
              আপনার অ্যাকাউন্টের ইমেইল ঠিকানাটি লিখুন। আমরা আপনাকে পাসওয়ার্ড রিসেট করার একটি লিংক পাঠাবো।
            </p>
            <form onSubmit={handleForgotSubmit}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="label" style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px', display: 'block' }}>ইমেইল ঠিকানা</label>
                <input
                  type="email"
                  className="input"
                  placeholder="example@gmail.com"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ padding: '8px 18px' }}
                  onClick={() => setShowForgotModal(false)}
                  disabled={forgotLoading}
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '8px 24px' }}
                  disabled={forgotLoading}
                >
                  {forgotLoading ? <span className="spinner" /> : 'লিংক পাঠান'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
