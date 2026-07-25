'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function SubscriptionPage() {
  const supabase = createClient()
  const [institution, setInstitution] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState<any[]>([])
  
  // Form state
  const [method, setMethod] = useState('bkash')
  const [trxId, setTrxId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: inst } = await supabase.from('institutions').select('*').eq('auth_user_id', user.id).single()
        setInstitution(inst)
        
        if (inst) {
          const { data: pays } = await supabase.from('mq_payments').select('*').eq('institution_id', inst.id).order('created_at', { ascending: false })
          if (pays) setPayments(pays)
        }
      }
      setLoading(false)
    }
    loadData()
  }, [])

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!trxId) {
      toast.error('Transaction ID দিন')
      return
    }
    if (!institution) {
      toast.error('প্রতিষ্ঠান লোড হয়নি')
      return
    }
    
    setSubmitting(true)
    
    const { error } = await supabase.from('mq_payments').insert({
      institution_id: institution.id,
      amount: 1000,
      payment_method: method,
      transaction_id: trxId,
      status: 'pending'
    })
    
    if (error) {
      toast.error('পেমেন্ট সাবমিট করতে সমস্যা হয়েছে')
    } else {
      toast.success('পেমেন্ট সফলভাবে জমা হয়েছে। অ্যাডমিন যাচাই করে সাবস্ক্রিপশন সক্রিয় করবেন।')
      setTrxId('')
      
      const { data: pays } = await supabase.from('mq_payments').select('*').eq('institution_id', institution.id).order('created_at', { ascending: false })
      if (pays) setPayments(pays)
    }
    setSubmitting(false)
  }

  if (loading) return <div className="flex justify-center p-8"><div className="spinner spinner-dark" /></div>

  return (
    <div style={{ width: '100%' }}>
      <div className="page-header mb-8" style={{ paddingLeft: 0, paddingRight: 0 }}>
        <h1 className="page-title">সাবস্ক্রিপশন</h1>
        <p className="page-subtitle">আপনার সাবস্ক্রিপশন স্ট্যাটাস এবং পেমেন্ট</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {/* Top Section: Payment Form & Status Card side-by-side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8" style={{ display: 'grid', gap: '28px' }}>
          
          {/* 1. Payment Form Card */}
          <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h2 className="text-xl font-bold mb-4" style={{ margin: '0 0 20px' }}>পেমেন্ট জমা দিন</h2>
            <form onSubmit={handleSubmitPayment} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label className="label" style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px', display: 'block' }}>পেমেন্ট মেথড</label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <label style={{ 
                    flex: '1', minWidth: '90px', border: '1.5px solid', borderRadius: '10px', padding: '10px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                    borderColor: method === 'bkash' ? '#e2136e' : '#d5e5da',
                    background: method === 'bkash' ? '#e2136e/10' : '#f8fbf9'
                  }}>
                    <input type="radio" name="method" value="bkash" className="hidden" checked={method === 'bkash'} onChange={() => setMethod('bkash')} />
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#e2136e' }}>bKash 🦅</span>
                  </label>
                  <label style={{ 
                    flex: '1', minWidth: '90px', border: '1.5px solid', borderRadius: '10px', padding: '10px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                    borderColor: method === 'nagad' ? '#ed1c24' : '#d5e5da',
                    background: method === 'nagad' ? '#ed1c24/10' : '#f8fbf9'
                  }}>
                    <input type="radio" name="method" value="nagad" className="hidden" checked={method === 'nagad'} onChange={() => setMethod('nagad')} />
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#ed1c24' }}>Nagad 💸</span>
                  </label>
                  <label style={{ 
                    flex: '1', minWidth: '90px', border: '1.5px solid', borderRadius: '10px', padding: '10px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                    borderColor: method === 'rocket' ? '#8c1562' : '#d5e5da',
                    background: method === 'rocket' ? '#8c1562/10' : '#f8fbf9'
                  }}>
                    <input type="radio" name="method" value="rocket" className="hidden" checked={method === 'rocket'} onChange={() => setMethod('rocket')} />
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#8c1562' }}>Rocket 🚀</span>
                  </label>
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label className="label" style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px', display: 'block' }}>অ্যামাউন্ট</label>
                <input type="text" className="input" style={{ background: '#f1f5f9', cursor: 'not-allowed', color: '#64748b' }} value="৳১,০০০" disabled />
              </div>
              <div className="form-group" style={{ marginBottom: '22px' }}>
                <label className="label" style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px', display: 'block' }}>Transaction ID (TrxID)</label>
                <input type="text" className="input" placeholder="উদা: 8HDF38DK2M" value={trxId} onChange={e => setTrxId(e.target.value)} required />
              </div>
              <button type="submit" disabled={submitting} className="btn btn-primary w-full" style={{ width: '100%', padding: '12px', justifyContent: 'center', fontWeight: 700, fontSize: '0.95rem', marginTop: 'auto' }} id="submit-payment-btn">
                {submitting ? <span className="spinner" /> : 'পেমেন্ট জমা দিন'}
              </button>
            </form>
          </div>

          {/* 2. Status Card */}
          <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h2 className="text-xl font-bold mb-4" style={{ margin: '0 0 16px' }}>বর্তমান স্ট্যাটাস</h2>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
              <div>
                {institution?.subscription_status === 'trial' && (
                  <div className="alert alert-info" style={{ margin: '0 0 16px', padding: '14px 18px', background: '#e0f2fe', color: '#0369a1', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                    <h3 className="font-bold" style={{ margin: '0 0 4px', fontSize: '0.95rem' }}>🎁 ট্রায়াল চলছে</h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: '1.5' }}>আপনার ৭ দিনের ফ্রি ট্রায়াল চলছে। ট্রায়াল শেষে সিস্টেম ব্যবহার চালিয়ে যেতে সাবস্ক্রিপশন ফি প্রদান করুন।</p>
                  </div>
                )}
                {institution?.subscription_status === 'active' && (
                  <div className="alert alert-success" style={{ margin: '0 0 16px', padding: '14px 18px', background: '#dcfce7', color: '#15803d', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                    <h3 className="font-bold" style={{ margin: '0 0 4px', fontSize: '0.95rem' }}>✅ সক্রিয় সাবস্ক্রিপশন</h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: '1.5' }}>মেয়াদ শেষ হবে: {institution?.subscription_expires_at ? new Date(institution.subscription_expires_at).toLocaleDateString('bn-BD') : 'N/A'}</p>
                  </div>
                )}
                {(institution?.subscription_status === 'expired' || institution?.subscription_status === 'inactive' || institution?.subscription_status === 'blocked') && (
                  <div className="alert alert-danger" style={{ margin: '0 0 16px', padding: '14px 18px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', border: '1px solid #fecaca' }}>
                    <h3 className="font-bold" style={{ margin: '0 0 4px', fontSize: '0.95rem' }}>⚠️ মেয়াদোত্তীর্ণ</h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: '1.5' }}>দয়া করে সাবস্ক্রিপশন ফি প্রদান করে অ্যাকাউন্ট সক্রিয় করুন।</p>
                  </div>
                )}
              </div>
              
              <div style={{ background: '#f0f9f4', padding: '18px', borderRadius: '12px', border: '1.5px solid #c8e6d0' }}>
                <h3 style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '1rem', margin: '0 0 8px' }}>বার্ষিক সাবস্ক্রিপশন ফি: ৳১,০০০</h3>
                <p style={{ color: 'var(--color-text)', fontSize: '0.86rem', fontWeight: 600, margin: '0 0 8px' }}>পেমেন্ট করার নিয়ম:</p>
                <ul style={{ listStyleType: 'disc', paddingLeft: '20px', fontSize: '0.82rem', color: '#4f6b5a', margin: 0 }}>
                  <li style={{ marginBottom: '4px' }}>নিচের যেকোনো নম্বরে Send Money করুন</li>
                  <li style={{ marginBottom: '4px' }}>বিকাশ/নগদ/রকেট নম্বর: <strong style={{ color: 'var(--color-primary-dark)' }}>01700-000000</strong> (Personal)</li>
                  <li style={{ marginBottom: '4px' }}>পেমেন্ট করার পর Transaction ID নিচের ফর্মে দিন</li>
                  <li>অ্যাডমিন আপনার পেমেন্ট যাচাই করে অ্যাকাউন্ট সক্রিয় করে দেবেন</li>
                </ul>
              </div>
            </div>
          </div>

        </div>

        {/* 3. History (Bottom - Shorter) */}
        <div className="card flex flex-col" style={{ maxHeight: '280px' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
            <h2 className="text-lg font-bold" style={{ margin: 0 }}>পেমেন্ট হিস্ট্রি</h2>
          </div>
          <div className="flex-1 overflow-y-auto" style={{ maxHeight: '220px' }}>
            {payments.length > 0 ? (
              <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
                      <th className="p-3" style={{ padding: '10px 12px', fontSize: '0.78rem' }}>তারিখ</th>
                      <th className="p-3" style={{ padding: '10px 12px', fontSize: '0.78rem' }}>মেথড</th>
                      <th className="p-3" style={{ padding: '10px 12px', fontSize: '0.78rem' }}>অ্যামাউন্ট</th>
                      <th className="p-3" style={{ padding: '10px 12px', fontSize: '0.78rem' }}>স্ট্যাটাস</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(payment => (
                      <tr key={payment.id} className="border-b border-[var(--color-border)] last:border-0 text-[var(--color-text)]" style={{ fontSize: '0.85rem' }}>
                        <td style={{ padding: '10px 12px' }}>{new Date(payment.created_at).toLocaleDateString('bn-BD')}</td>
                        <td style={{ padding: '10px 12px', textTransform: 'capitalize', fontWeight: 600 }}>{payment.payment_method}</td>
                        <td style={{ padding: '10px 12px' }}>৳{payment.amount}</td>
                        <td style={{ padding: '10px 12px' }}>
                          {payment.status === 'pending' && <span className="badge badge-warning" style={{ padding: '2px 6px', fontSize: '0.7rem' }}>অপেক্ষমাণ</span>}
                          {payment.status === 'approved' && <span className="badge badge-success" style={{ padding: '2px 6px', fontSize: '0.7rem' }}>অনুমোদিত</span>}
                          {payment.status === 'rejected' && <span className="badge badge-danger" style={{ padding: '2px 6px', fontSize: '0.7rem' }}>বাতিল</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                কোনো পেমেন্ট রেকর্ড নেই
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
