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

      <div className="tabs flex space-x-2 border-b overflow-x-auto" style={{ borderColor: 'var(--color-border)' }}>
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

      <div className="card">
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
                  <th className="p-3 text-right">অ্যাকশন</th>
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
                    <td className="p-3 text-right space-x-2">
                      <button className="btn btn-sm btn-secondary inline-flex items-center gap-1" onClick={() => setViewInst(inst)}>
                        <Eye size={14} /> বিস্তারিত
                      </button>
                      {!inst.is_approved && (
                        <button className="btn btn-sm btn-success inline-flex items-center gap-1" onClick={() => handleApprove(inst.id)}>
                          <CheckCircle size={14} /> অনুমোদন
                        </button>
                      )}
                      <button className="btn btn-sm btn-primary inline-flex items-center gap-1" onClick={() => setSubModalInst(inst)}>
                        <Calendar size={14} /> সাবস্ক্রিপশন
                      </button>
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
        <div className="modal-overlay fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="modal bg-white rounded-lg shadow-xl w-full max-w-lg" style={{ backgroundColor: 'var(--color-surface)' }}>
            <div className="modal-header p-4 border-b flex justify-between items-center" style={{ borderColor: 'var(--color-border)' }}>
              <h3 className="font-bold text-lg">প্রতিষ্ঠান বিস্তারিত</h3>
              <button onClick={() => setViewInst(null)} className="text-gray-500 hover:text-gray-700"><XCircle size={24} /></button>
            </div>
            <div className="modal-body p-4 space-y-4">
              <div className="flex items-center space-x-4 mb-4">
                {viewInst.logo_url && <img src={viewInst.logo_url} alt="logo" className="w-16 h-16 rounded-full object-cover border" />}
                <div>
                  <h4 className="font-bold text-xl">{viewInst.name}</h4>
                  <p className="text-gray-500">{viewInst.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><strong>ফোন:</strong> {viewInst.phone || '-'}</div>
                <div><strong>ঠিকানা:</strong> {viewInst.address || '-'}</div>
                <div><strong>অনুমোদিত:</strong> {viewInst.is_approved ? 'হ্যাঁ' : 'না'}</div>
                <div><strong>স্ট্যাটাস:</strong> {viewInst.subscription_status}</div>
                <div><strong>প্যাকেজ মেয়াদ:</strong> {viewInst.subscription_expiry ? new Date(viewInst.subscription_expiry).toLocaleDateString('bn-BD') : '-'}</div>
                <div><strong>যোগদানের তারিখ:</strong> {new Date(viewInst.created_at).toLocaleDateString('bn-BD')}</div>
              </div>
              <div className="flex justify-end pt-4 border-t gap-2" style={{ borderColor: 'var(--color-border)' }}>
                <button className={`btn ${viewInst.subscription_status === 'blocked' ? 'btn-success' : 'btn-danger'}`} onClick={() => { handleBlockUnblock(viewInst); setViewInst(null) }}>
                  {viewInst.subscription_status === 'blocked' ? 'আনব্লক করুন' : 'ব্লক করুন'}
                </button>
                <button className="btn btn-secondary" onClick={() => setViewInst(null)}>বন্ধ করুন</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Modal */}
      {subModalInst && (
        <div className="modal-overlay fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="modal bg-white rounded-lg shadow-xl w-full max-w-sm" style={{ backgroundColor: 'var(--color-surface)' }}>
            <div className="modal-header p-4 border-b flex justify-between items-center" style={{ borderColor: 'var(--color-border)' }}>
              <h3 className="font-bold text-lg">সাবস্ক্রিপশন সক্রিয়করণ</h3>
              <button onClick={() => setSubModalInst(null)} className="text-gray-500 hover:text-gray-700"><XCircle size={24} /></button>
            </div>
            <div className="modal-body p-4">
              <form onSubmit={handleActivateSubscription} className="space-y-4">
                <div className="form-group">
                  <label className="label">মেয়াদোত্তীর্ণের তারিখ</label>
                  <input
                    type="date"
                    className="input w-full"
                    required
                    value={subDate}
                    onChange={e => setSubDate(e.target.value)}
                  />
                </div>
                <div className="modal-footer flex justify-end gap-2 pt-4">
                  <button type="button" className="btn btn-secondary" onClick={() => setSubModalInst(null)}>বাতিল</button>
                  <button type="submit" className="btn btn-primary">সক্রিয় করুন</button>
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
