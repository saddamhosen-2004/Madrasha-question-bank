'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { CheckCircle, XCircle, Eye, Calendar } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

// types matching db
type Institution = {
  id: string
  name: string
  email: string
  phone: string
  address: string
  logo_url: string
  is_approved: boolean
  subscription_status: string
  subscription_expiry: string
  created_at: string
}

function InstitutionsContent() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'active' | 'blocked'>('all')
  
  const [viewInst, setViewInst] = useState<Institution | null>(null)
  const [subModalInst, setSubModalInst] = useState<Institution | null>(null)
  const [subDate, setSubDate] = useState('')

  useEffect(() => {
    if (tabParam && ['all', 'pending', 'active', 'blocked'].includes(tabParam)) {
      setActiveTab(tabParam as any)
    }
  }, [tabParam])

  useEffect(() => {
    fetchInstitutions()
  }, [activeTab])

  const fetchInstitutions = async () => {
    setLoading(true)
    let query = supabase.from('institutions').select('*').order('created_at', { ascending: false })
    
    if (activeTab === 'pending') query = query.eq('is_approved', false)
    if (activeTab === 'active') query = query.eq('subscription_status', 'active')
    if (activeTab === 'blocked') query = query.eq('subscription_status', 'blocked')
    
    const { data, error } = await query
    if (error) {
      toast.error('প্রতিষ্ঠান লোড করতে সমস্যা হয়েছে')
    } else {
      setInstitutions(data || [])
    }
    setLoading(false)
  }

  const handleApprove = async (id: string) => {
    if (!window.confirm('আপনি কি এই প্রতিষ্ঠানটি অনুমোদন করতে চান?')) return
    const { error } = await supabase.from('institutions').update({ is_approved: true }).eq('id', id)
    if (error) toast.error('অনুমোদনে সমস্যা হয়েছে')
    else {
      toast.success('অনুমোদিত হয়েছে')
      fetchInstitutions()
    }
  }

  const handleBlockUnblock = async (inst: Institution) => {
    const isBlocked = inst.subscription_status === 'blocked'
    const newStatus = isBlocked ? 'trial' : 'blocked'
    if (!window.confirm(`আপনি কি এই প্রতিষ্ঠানটি ${isBlocked ? 'আনব্লক' : 'ব্লক'} করতে চান?`)) return
    
    const { error } = await supabase.from('institutions').update({ subscription_status: newStatus }).eq('id', inst.id)
    if (error) toast.error('স্ট্যাটাস আপডেটে সমস্যা হয়েছে')
    else {
      toast.success(`প্রতিষ্ঠানটি ${isBlocked ? 'আনব্লক' : 'ব্লক'} করা হয়েছে`)
      fetchInstitutions()
      if (viewInst?.id === inst.id) setViewInst({ ...viewInst, subscription_status: newStatus })
    }
  }

  const handleActivateSubscription = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subModalInst || !subDate) return
    const { error } = await supabase.from('institutions').update({
      subscription_status: 'active',
      subscription_expiry: new Date(subDate).toISOString()
    }).eq('id', subModalInst.id)
    
    if (error) toast.error('সাবস্ক্রিপশন চালু করতে সমস্যা হয়েছে')
    else {
      toast.success('সাবস্ক্রিপশন সক্রিয় করা হয়েছে')
      setSubModalInst(null)
      fetchInstitutions()
    }
  }

  const renderBadge = (inst: Institution) => {
    if (!inst.is_approved) return <span className="badge badge-warning">অনুমোদনের অপেক্ষায়</span>
    if (inst.subscription_status === 'trial') return <span className="badge badge-info">ট্রায়াল</span>
    if (inst.subscription_status === 'active') return <span className="badge badge-success">সক্রিয়</span>
    if (inst.subscription_status === 'expired') return <span className="badge badge-danger">মেয়াদোত্তীর্ণ</span>
    if (inst.subscription_status === 'blocked') return <span className="badge badge-danger">ব্লক</span>
    return <span className="badge badge-info">{inst.subscription_status}</span>
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">প্রতিষ্ঠান ব্যবস্থাপনা</h1>
        <p className="page-subtitle">সকল নিবন্ধিত প্রতিষ্ঠানের তালিকা</p>
      </div>

      <div className="tabs flex space-x-2 border-b overflow-x-auto" style={{ borderColor: 'var(--color-border)', marginBottom: '24px' }}>
        {[
          { id: 'all', label: 'সকল' },
          { id: 'pending', label: 'অনুমোদনের অপেক্ষায়' },
          { id: 'active', label: 'সক্রিয়' },
          { id: 'blocked', label: 'ব্লক' }
        ].map(tab => (
          <button 
            key={tab.id} 
            className={`tab-btn whitespace-nowrap px-4 py-2 ${activeTab === tab.id ? 'border-b-2 border-[var(--color-primary)] font-bold text-[var(--color-primary)]' : 'text-gray-500'}`}
            onClick={() => setActiveTab(tab.id as any)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: '24px' }}>
        {loading ? (
          <div className="flex justify-center py-8"><div className="spinner"></div></div>
        ) : institutions.length === 0 ? (
          <div className="empty-state">কোনো প্রতিষ্ঠান পাওয়া যায়নি</div>
        ) : (
          <div className="table-wrap">
            <table className="w-full text-left whitespace-nowrap">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <th className="p-3">লোগো</th>
                  <th className="p-3">নাম</th>
                  <th className="p-3">ইমেইল</th>
                  <th className="p-3">ফোন</th>
                  <th className="p-3">স্ট্যাটাস</th>
                  <th className="p-3">তারিখ</th>
                  <th className="p-3" style={{ textAlign: 'right' }}>অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {institutions.map((inst) => (
                  <tr key={inst.id} className="border-b hover:bg-gray-50 transition-colors" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="p-3">
                      {inst.logo_url ? (
                        <img src={inst.logo_url} alt="logo" className="w-10 h-10 rounded-full object-cover" style={{ width: '40px', height: '40px' }} />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500" style={{ width: '40px', height: '40px' }}>N/A</div>
                      )}
                    </td>
                    <td className="p-3">{inst.name}</td>
                    <td className="p-3">{inst.email}</td>
                    <td className="p-3">{inst.phone || '-'}</td>
                    <td className="p-3">{renderBadge(inst)}</td>
                    <td className="p-3">{new Date(inst.created_at).toLocaleDateString('bn-BD')}</td>
                    <td className="p-3">
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', alignItems: 'center' }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '6px 12px', fontSize: '0.82rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }} 
                          onClick={() => setViewInst(inst)}
                        >
                          <Eye size={14} /> বিস্তারিত
                        </button>
                        {!inst.is_approved && (
                          <button 
                            className="btn btn-success" 
                            style={{ padding: '6px 12px', fontSize: '0.82rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }} 
                            onClick={() => handleApprove(inst.id)}
                          >
                            <CheckCircle size={14} /> অনুমোদন
                          </button>
                        )}
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '6px 12px', fontSize: '0.82rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }} 
                          onClick={() => setSubModalInst(inst)}
                        >
                          <Calendar size={14} /> সাবস্ক্রিপশন
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {viewInst && (
        <div className="modal-overlay fixed inset-0 bg-black/50 flex items-center justify-center z-50" style={{ padding: '16px' }}>
          <div className="modal w-full max-w-lg" style={{ backgroundColor: 'var(--color-surface)', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.25)' }}>
            
            {/* Hero Header */}
            <div style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, #0d5c33 100%)', padding: '28px 28px 48px', position: 'relative' }}>
              <button 
                onClick={() => setViewInst(null)} 
                style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'rgba(255,255,255,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', borderRadius: '50%', padding: '6px', color: 'white' }}
              >
                <XCircle size={20} />
              </button>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>প্রতিষ্ঠান বিস্তারিত</p>
              <h3 style={{ color: 'white', fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>{viewInst.name}</h3>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.85rem', margin: '6px 0 0' }}>{viewInst.email}</p>
            </div>

            {/* Avatar Overlap */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '-36px', marginBottom: '4px' }}>
              {viewInst.logo_url ? (
                <img src={viewInst.logo_url} alt="logo" style={{ width: '72px', height: '72px', borderRadius: '50%', border: '4px solid white', objectFit: 'cover', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }} />
              ) : (
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', border: '4px solid white', background: 'linear-gradient(135deg, #1a6b3c, #0d5c33)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.8rem', color: 'white', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
                  {viewInst.name?.charAt(0)?.toUpperCase() || 'প'}
                </div>
              )}
            </div>

            {/* Info Body */}
            <div style={{ padding: '8px 24px 24px' }}>
              {/* Status Row */}
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                {renderBadge(viewInst)}
                {viewInst.is_approved && (
                  <span style={{ marginLeft: '8px', fontSize: '0.78rem', color: '#16a34a', background: '#f0fdf4', padding: '3px 10px', borderRadius: '20px', border: '1px solid #bbf7d0', fontWeight: 600 }}>✓ অনুমোদিত</span>
                )}
              </div>

              {/* Info Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                {[
                  { icon: '📞', label: 'ফোন নম্বর', value: viewInst.phone || 'প্রদান করা হয়নি' },
                  { icon: '📍', label: 'ঠিকানা', value: viewInst.address || 'প্রদান করা হয়নি' },
                  { icon: '📦', label: 'প্যাকেজ মেয়াদ', value: viewInst.subscription_expiry ? new Date(viewInst.subscription_expiry).toLocaleDateString('bn-BD') : 'নির্ধারিত নয়' },
                  { icon: '📅', label: 'যোগদানের তারিখ', value: new Date(viewInst.created_at).toLocaleDateString('bn-BD') },
                ].map((item, i) => (
                  <div key={i} style={{ background: '#f8fafb', borderRadius: '12px', padding: '14px 16px', border: '1px solid #eef2f7' }}>
                    <div style={{ fontSize: '1.1rem', marginBottom: '6px' }}>{item.icon}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '4px', fontWeight: 500 }}>{item.label}</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.3 }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Action Footer */}
              <div style={{ display: 'flex', gap: '10px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
                <button 
                  style={{ 
                    flex: 1, padding: '11px', borderRadius: '10px', border: 'none', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'inherit',
                    background: viewInst.subscription_status === 'blocked' ? '#f0fdf4' : '#fef2f2',
                    color: viewInst.subscription_status === 'blocked' ? '#16a34a' : '#dc2626',
                    transition: 'opacity 0.15s'
                  }} 
                  onClick={() => { handleBlockUnblock(viewInst); setViewInst(null) }}
                >
                  {viewInst.subscription_status === 'blocked' ? '🔓 আনব্লক করুন' : '🚫 ব্লক করুন'}
                </button>
                <button 
                  style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid var(--color-border)', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', background: 'white', color: 'var(--color-text)', fontFamily: 'inherit' }}
                  onClick={() => setViewInst(null)}
                >
                  বন্ধ করুন
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Subscription Modal */}
      {subModalInst && (
        <div className="modal-overlay fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="modal bg-white rounded-lg shadow-xl w-full max-w-sm" style={{ backgroundColor: 'var(--color-surface)', overflow: 'hidden' }}>
            <div className="modal-header p-4 border-b flex justify-between items-center" style={{ borderColor: 'var(--color-border)', padding: '20px 24px' }}>
              <h3 className="font-bold text-lg" style={{ fontSize: '1.2rem', color: 'var(--color-text)' }}>সাবস্ক্রিপশন সক্রিয়করণ</h3>
              <button onClick={() => setSubModalInst(null)} className="text-gray-500 hover:text-gray-700" style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><XCircle size={24} /></button>
            </div>
            <div className="modal-body" style={{ padding: '24px' }}>
              <form onSubmit={handleActivateSubscription}>
                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label className="label" style={{ fontWeight: 600, color: 'var(--color-text)', display: 'block', fontSize: '0.9rem' }}>মেয়াদোত্তীর্ণের তারিখ</label>
                  <input
                    type="date"
                    className="input w-full"
                    style={{ height: '42px', display: 'block', marginTop: '8px' }}
                    required
                    value={subDate}
                    onChange={e => setSubDate(e.target.value)}
                  />
                </div>
                <div className="modal-footer" style={{ padding: '16px 0 0', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button type="button" className="btn btn-ghost" style={{ padding: '8px 18px', fontSize: '0.88rem' }} onClick={() => setSubModalInst(null)}>বাতিল</button>
                  <button type="submit" className="btn btn-primary" style={{ padding: '8px 24px', fontSize: '0.88rem' }}>সক্রিয় করুন</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function InstitutionsManagement() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8"><div className="spinner spinner-dark" /></div>}>
      <InstitutionsContent />
    </Suspense>
  )
}
