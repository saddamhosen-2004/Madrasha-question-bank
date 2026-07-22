'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    institution_name: '',
    email: '',
    password: '',
    confirm_password: '',
    phone: '',
    address: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('লোগোর সাইজ সর্বোচ্চ ২ MB হতে পারবে')
      return
    }
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirm_password) {
      toast.error('পাসওয়ার্ড দুটো মিলছে না')
      return
    }
    if (form.password.length < 6) {
      toast.error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে')
      return
    }

    setLoading(true)
    const supabase = createClient()

    // 1. Call standard signUp with metadata. DB triggers will auto-confirm the email and create the institution record.
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          institution_name: form.institution_name,
          phone: form.phone || null,
          address: form.address || null,
          logo_url: null,
        }
      }
    })

    if (authError || !authData.user) {
      toast.error('নিবন্ধন ব্যর্থ হয়েছে: ' + (authError?.message || 'ইউজার পাওয়া যায়নি'))
      setLoading(false)
      return
    }

    const userId = authData.user.id

    // 2. Upload logo if provided and update institution + user metadata record
    if (logoFile && userId) {
      const ext = logoFile.name.split('.').pop()
      const filePath = `${userId}/logo.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('institution-logos')
        .upload(filePath, logoFile, { upsert: true })

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('institution-logos')
          .getPublicUrl(filePath)
        
        // Update user metadata in auth.users
        await supabase.auth.updateUser({
          data: { logo_url: urlData.publicUrl }
        })

        // Update logo url in institutions table
        await supabase
          .from('institutions')
          .update({ logo_url: urlData.publicUrl })
          .eq('auth_user_id', userId)
      }
    }

    toast.success('নিবন্ধন সফল! অ্যাডমিন অনুমোদনের জন্য অপেক্ষা করুন।')
    router.push('/auth/pending')
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
        maxWidth: '500px',
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1a6b3c, #2a8a50)',
          padding: '28px 32px 24px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🏫</div>
          <h1 style={{ color: 'white', fontSize: '1.2rem', fontWeight: 700, marginBottom: '4px' }}>
            প্রতিষ্ঠান নিবন্ধন
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>
            নতুন অ্যাকাউন্ট তৈরি করুন — ৭ দিন বিনামূল্যে ব্যবহার করুন
          </p>
        </div>

        <form onSubmit={handleRegister} style={{ padding: '24px 32px 32px' }}>
          {/* Logo Upload */}
          <div className="form-group" style={{ textAlign: 'center' }}>
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                width: '90px', height: '90px',
                border: '2px dashed var(--color-border)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 10px',
                cursor: 'pointer',
                overflow: 'hidden',
                background: logoPreview ? 'transparent' : 'var(--color-surface-2)',
                transition: 'border-color 0.2s',
              }}
            >
              {logoPreview ? (
                <img src={logoPreview} alt="লোগো" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '4px' }}>
                  লোগো যোগ করুন
                </span>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoChange} id="logo-upload" />
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              লোগো (ঐচ্ছিক) — সর্বোচ্চ ২ MB
            </p>
          </div>

          <div className="form-group">
            <label className="label">প্রতিষ্ঠানের নাম *</label>
            <input
              type="text"
              name="institution_name"
              className="input"
              placeholder="যেমন: দারুল উলুম মাদ্রাসা"
              value={form.institution_name}
              onChange={handleChange}
              required
              id="reg-institution-name"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="label">ইমেইল *</label>
              <input
                type="email"
                name="email"
                className="input"
                placeholder="email@gmail.com"
                value={form.email}
                onChange={handleChange}
                required
                id="reg-email"
              />
            </div>
            <div className="form-group">
              <label className="label">মোবাইল নম্বর</label>
              <input
                type="tel"
                name="phone"
                className="input"
                placeholder="01XXXXXXXXX"
                value={form.phone}
                onChange={handleChange}
                id="reg-phone"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="label">পাসওয়ার্ড *</label>
              <input
                type="password"
                name="password"
                className="input"
                placeholder="কমপক্ষে ৬ অক্ষর"
                value={form.password}
                onChange={handleChange}
                required
                id="reg-password"
              />
            </div>
            <div className="form-group">
              <label className="label">পাসওয়ার্ড নিশ্চিত করুন *</label>
              <input
                type="password"
                name="confirm_password"
                className="input"
                placeholder="পাসওয়ার্ড আবার লিখুন"
                value={form.confirm_password}
                onChange={handleChange}
                required
                id="reg-confirm-password"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label">ঠিকানা</label>
            <input
              type="text"
              name="address"
              className="input"
              placeholder="প্রতিষ্ঠানের ঠিকানা (ঐচ্ছিক)"
              value={form.address}
              onChange={handleChange}
              id="reg-address"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: '8px', padding: '13px' }}
            id="reg-submit"
          >
            {loading ? (
              <><div className="spinner" /> নিবন্ধন হচ্ছে...</>
            ) : 'নিবন্ধন করুন'}
          </button>

          <p style={{ textAlign: 'center', marginTop: '18px', fontSize: '0.83rem', color: 'var(--color-text-muted)' }}>
            ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
            <Link href="/auth/login" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
              লগইন করুন
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
