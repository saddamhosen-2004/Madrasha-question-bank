'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Settings, Upload, X, Save, RefreshCw } from 'lucide-react'
import Image from 'next/image'

export default function SiteSettingsPage() {
  const [siteName, setSiteName] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('site_settings')
      .select('*')
      .eq('id', 1)
      .single()

    if (data) {
      setSiteName(data.site_name || '')
      setLogoUrl(data.site_logo_url || null)
      setLogoPreview(data.site_logo_url || null)
    }
    setLoading(false)
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

  function removeLogo() {
    setLogoFile(null)
    setLogoPreview(null)
    setLogoUrl(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!siteName.trim()) {
      toast.error('সাইটের নাম খালি রাখা যাবে না')
      return
    }

    setSaving(true)
    const supabase = createClient()
    let finalLogoUrl = logoUrl

    // Upload new logo if selected
    if (logoFile) {
      const ext = logoFile.name.split('.').pop()
      const filePath = `site-logo.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('site-assets')
        .upload(filePath, logoFile, { upsert: true })

      if (uploadError) {
        toast.error('লোগো আপলোড ব্যর্থ: ' + uploadError.message)
        setSaving(false)
        return
      }

      const { data: urlData } = supabase.storage
        .from('site-assets')
        .getPublicUrl(filePath)
      finalLogoUrl = urlData.publicUrl + '?t=' + Date.now()
    }

    // Update site_settings row
    const { error } = await supabase
      .from('site_settings')
      .update({
        site_name: siteName.trim(),
        site_logo_url: finalLogoUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1)

    if (error) {
      toast.error('সংরক্ষণ ব্যর্থ: ' + error.message)
    } else {
      toast.success('সাইট সেটিংস সফলভাবে সংরক্ষিত হয়েছে!')
      setLogoUrl(finalLogoUrl)
      setLogoFile(null)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '12px', color: 'var(--color-text-muted)' }}>
        <RefreshCw style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} />
        লোড হচ্ছে...
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '640px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #0f9e6e, #0d7a54)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Settings style={{ width: '20px', height: '20px', color: 'white' }} />
          </div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
            সাইট সেটিংস
          </h1>
        </div>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', margin: 0 }}>
          সাইটের নাম ও লোগো পরিবর্তন করুন। এটি লগইন পেজে দেখানো হবে।
        </p>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSave}>
        <div className="card" style={{ padding: '28px', borderRadius: '16px' }}>

          {/* Logo Section */}
          <div style={{ marginBottom: '28px' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text)', marginBottom: '14px' }}>
              সাইট লোগো
            </label>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
              {/* Preview */}
              <div style={{
                width: '90px', height: '90px', borderRadius: '18px',
                background: logoPreview ? 'transparent' : 'linear-gradient(135deg, #0f9e6e, #0d7a54)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2.2rem',
                border: '2px dashed #c8e6d0',
                overflow: 'hidden',
                flexShrink: 0,
                position: 'relative',
              }}>
                {logoPreview ? (
                  <Image
                    src={logoPreview}
                    alt="লোগো প্রিভিউ"
                    fill
                    style={{ objectFit: 'cover' }}
                    unoptimized
                  />
                ) : (
                  '📚'
                )}
              </div>

              {/* Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                  onChange={handleLogoChange}
                  style={{ display: 'none' }}
                  id="logo-upload"
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '9px 18px',
                    background: 'var(--color-primary)',
                    color: 'white',
                    border: 'none', borderRadius: '9px',
                    fontSize: '0.86rem', fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'opacity 0.15s',
                  }}
                >
                  <Upload style={{ width: '15px', height: '15px' }} />
                  লোগো আপলোড করুন
                </button>

                {logoPreview && (
                  <button
                    type="button"
                    onClick={removeLogo}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '9px 18px',
                      background: '#fee2e2',
                      color: '#dc2626',
                      border: 'none', borderRadius: '9px',
                      fontSize: '0.86rem', fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    <X style={{ width: '15px', height: '15px' }} />
                    লোগো মুছুন
                  </button>
                )}

                <p style={{ fontSize: '0.77rem', color: 'var(--color-text-muted)', margin: 0 }}>
                  সর্বোচ্চ ২ MB • PNG, JPG, WebP, SVG
                </p>
              </div>
            </div>
          </div>

          <div style={{ height: '1px', background: 'var(--color-border)', margin: '4px 0 24px' }} />

          {/* Site Name */}
          <div style={{ marginBottom: '28px' }}>
            <label htmlFor="site-name" style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text)', marginBottom: '10px' }}>
              সাইটের নাম
            </label>
            <input
              id="site-name"
              type="text"
              className="input"
              value={siteName}
              onChange={e => setSiteName(e.target.value)}
              placeholder="যেমন: মাদ্রাসা প্রশ্নব্যাংক"
              required
              style={{ fontSize: '1rem' }}
            />
            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '6px' }}>
              এই নামটি লগইন পেজের শীর্ষে প্রদর্শিত হবে।
            </p>
          </div>

          {/* Preview Box */}
          <div style={{
            background: '#f0f9f4',
            border: '1.5px solid #c8e6d0',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '14px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              লাইভ প্রিভিউ
            </p>
            <div style={{
              width: '56px', height: '56px', borderRadius: '14px',
              background: logoPreview ? 'transparent' : 'linear-gradient(135deg, #0f9e6e, #0d7a54)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.6rem',
              margin: '0 auto 10px',
              overflow: 'hidden',
              position: 'relative',
              boxShadow: '0 4px 14px rgba(15,158,110,0.3)',
            }}>
              {logoPreview ? (
                <Image src={logoPreview} alt="preview" fill style={{ objectFit: 'cover' }} unoptimized />
              ) : '📚'}
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0e2015' }}>
              {siteName || 'সাইটের নাম'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#6b8c7d', marginTop: '4px' }}>
              আপনার প্রতিষ্ঠানের অ্যাকাউন্টে লগইন করুন
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
            style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: '0.95rem' }}
            id="save-settings"
          >
            {saving ? (
              <><RefreshCw style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> সংরক্ষণ হচ্ছে...</>
            ) : (
              <><Save style={{ width: '16px', height: '16px' }} /> পরিবর্তন সংরক্ষণ করুন</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
