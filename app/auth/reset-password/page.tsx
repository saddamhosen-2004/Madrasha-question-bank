'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import Image from 'next/image'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [siteName, setSiteName] = useState('মাদ্রাসা প্রশ্নব্যাংক')
  const [siteLogoUrl, setSiteLogoUrl] = useState<string | null>(null)

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

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    
    if (password.length < 6) {
      toast.error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে')
      return
    }

    if (password !== confirmPassword) {
      toast.error('পাসওয়ার্ড দুটি মিলছে না')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      toast.error('পাসওয়ার্ড রিসেট করতে সমস্যা হয়েছে: ' + error.message)
      setLoading(false)
      return
    }

    toast.success('পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!')
    router.push('/auth/login')
  }

  return (
    <>
      <style>{`
        .login-bg {
          min-height: 100vh;
          background-color: #f0f4f8;
          background-image:
            linear-gradient(rgba(0,180,120,0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,180,120,0.07) 1px, transparent 1px);
          background-size: 32px 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          font-family: 'Hind Siliguri', 'Noto Sans Bengali', sans-serif;
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
          font-size: 1.6rem;
          font-weight: 800;
          color: #1e293b;
          text-align: center;
          margin: 0 0 6px;
        }

        .login-subtitle {
          font-size: 0.9rem;
          color: #64748b;
          text-align: center;
          margin: 0;
          font-weight: 500;
        }

        .login-divider {
          height: 1px;
          background: #e2e8f0;
          margin: 24px 0;
        }

        .login-field {
          margin-bottom: 20px;
        }

        .login-label {
          display: block;
          font-size: 0.88rem;
          font-weight: 600;
          color: #334155;
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
          color: #94a3b8;
          display: flex;
          align-items: center;
        }

        .login-input {
          width: 100%;
          padding: 11px 14px 11px 42px;
          font-size: 0.95rem;
          border: 1.5px solid #cbd5e1;
          border-radius: 10px;
          background: #f8fafc;
          color: #0f172a;
          transition: all 0.2s;
          font-family: inherit;
        }

        .login-input:focus {
          outline: none;
          border-color: #0f9e6e;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(15,158,110,0.12);
        }

        .login-input-right-icon {
          position: absolute;
          right: 14px;
          color: #94a3b8;
          cursor: pointer;
          background: none;
          border: none;
          padding: 0;
          display: flex;
          align-items: center;
        }

        .login-input-right-icon:hover {
          color: #475569;
        }

        .login-btn {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #0f9e6e, #0d7a54);
          color: #ffffff;
          border: none;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(15,158,110,0.20);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-family: inherit;
        }

        .login-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(15,158,110,0.30);
        }

        .login-btn:active {
          transform: translateY(0);
        }

        .login-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          transform: none;
        }

        .login-register-row {
          text-align: center;
          font-size: 0.88rem;
          color: #64748b;
          margin: 24px 0 0;
          font-weight: 500;
        }

        .login-register-link {
          color: #0f9e6e;
          font-weight: 700;
          margin-left: 6px;
          text-decoration: none;
        }

        .login-register-link:hover {
          text-decoration: underline;
        }

        .login-footer {
          margin-top: 32px;
          text-align: center;
          font-size: 0.82rem;
          color: #94a3b8;
          font-weight: 500;
        }

        .login-footer a {
          color: #64748b;
          font-weight: 600;
          text-decoration: underline;
          transition: color 0.2s;
        }

        .login-footer a:hover {
          color: #0f9e6e;
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
          <p className="login-subtitle">আপনার নতুন পাসওয়ার্ড সেট করুন</p>

          <div className="login-divider" />

          {/* Form */}
          <form onSubmit={handleResetPassword}>

            {/* New Password */}
            <div className="login-field">
              <label className="login-label" htmlFor="new-password">নতুন পাসওয়ার্ড</label>
              <div className="login-input-wrap">
                <span className="login-input-icon">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  className="login-input"
                  placeholder="কমপক্ষে ৬টি অক্ষর"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="login-input-right-icon"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
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

            {/* Confirm Password */}
            <div className="login-field">
              <label className="login-label" htmlFor="confirm-password">পাসওয়ার্ড নিশ্চিত করুন</label>
              <div className="login-input-wrap">
                <span className="login-input-icon">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  id="confirm-password"
                  type="password"
                  className="login-input"
                  placeholder="পুনরায় পাসওয়ার্ড লিখুন"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Submit */}
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'পাসওয়ার্ড আপডেট হচ্ছে...' : 'পাসওয়ার্ড আপডেট করুন'}
            </button>
          </form>

          {/* Back to Login link */}
          <p className="login-register-row">
            <Link href="/auth/login" className="login-register-link" style={{ marginLeft: 0 }}>
              লগইন পেজে ফিরে যান
            </Link>
          </p>

          {/* Footer */}
          <p className="login-footer">
            Developed with 💙 by <a href="https://dgtalcommerce.com" target="_blank" rel="noopener noreferrer">dgtalcommerce.com</a>
          </p>
        </div>
      </div>
    </>
  )
}
