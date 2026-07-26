'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import Image from 'next/image'

export default function ProfilePage() {
  const supabase = createClient()
  const [institution, setInstitution] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: ''
  })

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: inst } = await supabase.from('institutions').select('*').eq('auth_user_id', user.id).single()
        setInstitution(inst)
        if (inst) {
          setFormData({
            name: inst.name || '',
            phone: inst.phone || '',
            address: inst.address || ''
          })
        }
      }
      setLoading(false)
    }
    loadData()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    const { error } = await supabase
      .from('institutions')
      .update({
        name: formData.name,
        phone: formData.phone,
        address: formData.address
      })
      .eq('id', institution.id)
      
    if (error) {
      toast.error('প্রোফাইল আপডেট করতে সমস্যা হয়েছে')
    } else {
      toast.success('প্রোফাইল সফলভাবে আপডেট হয়েছে')
      // Update local storage/state name if needed
      setInstitution({ ...institution, name: formData.name })
    }
    setSaving(false)
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    
    if (file.size > 2 * 1024 * 1024) {
      toast.error('লোগোর সাইজ ২ মেগাবাইটের বেশি হতে পারবে না')
      return
    }

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${institution.id}-${Math.random()}.${fileExt}`
      const filePath = `logos/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('public')
        .getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('institutions')
        .update({ logo_url: publicUrl })
        .eq('id', institution.id)

      if (updateError) throw updateError

      setInstitution({ ...institution, logo_url: publicUrl })
      toast.success('লোগো সফলভাবে আপডেট হয়েছে')
    } catch (error) {
      toast.error('লোগো আপলোড করতে সমস্যা হয়েছে')
      console.error(error)
    }
    setUploading(false)
  }

  if (loading) return <div className="flex justify-center p-8"><div className="spinner spinner-dark" /></div>

  return (
    <div className="space-y-6">
      {/* Colorful Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #052e16 0%, #0f5d34 50%, #16a34a 100%)',
        padding: '32px 32px 28px',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '0 0 24px 24px',
        boxShadow: '0 8px 32px rgba(15,93,52,0.3)',
        marginBottom: '28px'
      }}>
        <div style={{ position: 'absolute', right: '-30px', top: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: '100px', bottom: '-60px', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 6px' }}>ইউজার প্যানেল</p>
          <h1 style={{ color: 'white', fontSize: '1.9rem', fontWeight: 800, margin: '0 0 6px' }}>প্রতিষ্ঠান প্রোফাইল</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.88rem', margin: 0 }}>আপনার প্রতিষ্ঠানের তথ্য এবং লোগো পরিবর্তন করুন</p>
        </div>
      </div>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 28px 28px', width: '100%' }}>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Top Green Gradient Section */}
        <div style={{
          background: 'linear-gradient(135deg, #052e16 0%, #0f5d34 100%)',
          padding: '36px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          borderBottom: '1px solid rgba(15, 93, 52, 0.15)'
        }}>
          {/* Logo Section */}
          <div className="relative w-32 h-32 rounded-full border-4 border-white/20 overflow-hidden bg-white/10 flex items-center justify-center shadow-lg group" style={{ position: 'relative' }}>
            {institution?.logo_url ? (
              <Image src={institution.logo_url} alt="Logo" fill className="object-cover" unoptimized />
            ) : (
              <span className="text-4xl text-white font-bold">{institution?.name?.charAt(0) || 'I'}</span>
            )}
            
            <label className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity" style={{ position: 'absolute' }}>
              {uploading ? (
                <span className="spinner spinner-light" />
              ) : (
                <>
                  <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  <span className="text-xs font-semibold">লোগো পরিবর্তন</span>
                </>
              )}
              <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={uploading} />
            </label>
          </div>
          
          <div className="text-center">
            <h3 className="font-bold text-xl text-white" style={{ margin: '0 0 4px' }}>{institution?.name}</h3>
            <p className="text-sm text-white/70" style={{ margin: 0 }}>{institution?.email}</p>
          </div>
        </div>

        {/* Bottom Form Section */}
        <div style={{ padding: '28px' }}>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="form-group" style={{ marginBottom: '18px' }}>
              <label className="label" style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px', display: 'block' }}>প্রতিষ্ঠানের নাম</label>
              <input type="text" className="input" placeholder="প্রতিষ্ঠানের নাম লিখুন" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div className="form-group" style={{ marginBottom: '18px' }}>
              <label className="label" style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px', display: 'block' }}>ইমেইল</label>
              <input type="email" className="input" style={{ background: '#f1f5f9', cursor: 'not-allowed', color: '#64748b' }} value={institution?.email || ''} disabled />
              <p className="text-xs text-[var(--color-text-muted)] mt-1" style={{ margin: '4px 0 0' }}>লগইন ইমেইল পরিবর্তন করতে চাইলে অ্যাডমিনের সাথে যোগাযোগ করুন</p>
            </div>
            <div className="form-group" style={{ marginBottom: '18px' }}>
              <label className="label" style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px', display: 'block' }}>মোবাইল নম্বর</label>
              <input type="text" className="input" placeholder="উদা: 017XXXXXXX" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
            </div>
            <div className="form-group" style={{ marginBottom: '22px' }}>
              <label className="label" style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px', display: 'block' }}>ঠিকানা</label>
              <textarea className="input min-h-[100px]" placeholder="প্রতিষ্ঠানের সম্পূর্ণ ঠিকানা লিখুন" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required />
            </div>
            
            <div className="pt-4 border-t border-[var(--color-border)] flex justify-end" style={{ paddingTop: '16px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" disabled={saving} className="btn btn-primary px-8" style={{ padding: '10px 28px', fontSize: '0.92rem' }} id="profile-save-btn">
                {saving ? <span className="spinner" /> : 'সেভ করুন'}
              </button>
            </div>
          </form>
        </div>
      </div>

      </div>
    </div>
  )
}
