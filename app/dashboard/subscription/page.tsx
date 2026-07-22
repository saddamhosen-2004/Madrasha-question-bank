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
    <div className="pb-24">
      <div className="page-header mb-8">
        <h1 className="page-title">সাবস্ক্রিপশন</h1>
        <p className="page-subtitle">আপনার সাবস্ক্রিপশন স্ট্যাটাস এবং পেমেন্ট</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Status */}
        <div>
          <div className="card p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">বর্তমান স্ট্যাটাস</h2>
            {institution?.subscription_status === 'trial' && (
              <div className="alert alert-info">
                <h3 className="font-bold">ট্রায়াল চলছে</h3>
                <p>আপনার ৭ দিনের ফ্রি ট্রায়াল চলছে। ট্রায়াল শেষে সিস্টেম ব্যবহার চালিয়ে যেতে সাবস্ক্রিপশন ফি প্রদান করুন।</p>
              </div>
            )}
            {institution?.subscription_status === 'active' && (
              <div className="alert alert-success">
                <h3 className="font-bold mb-2">সক্রিয় সাবস্ক্রিপশন</h3>
                <p>মেয়াদ শেষ হবে: {institution?.subscription_expires_at ? new Date(institution.subscription_expires_at).toLocaleDateString('bn-BD') : 'N/A'}</p>
              </div>
            )}
            {(institution?.subscription_status === 'expired' || institution?.subscription_status === 'inactive' || institution?.subscription_status === 'blocked') && (
              <div className="alert alert-danger">
                <h3 className="font-bold mb-2">মেয়াদোত্তীর্ণ</h3>
                <p>দয়া করে সাবস্ক্রিপশন ফি প্রদান করে অ্যাকাউন্ট সক্রিয় করুন।</p>
              </div>
            )}
            
            <div className="mt-6 p-4 bg-[var(--color-primary-50)] rounded-lg border border-[var(--color-primary)]">
              <h3 className="font-bold text-[var(--color-primary)] mb-2">বার্ষিক সাবস্ক্রিপশন ফি: ৳১,০০০</h3>
              <p className="text-sm text-[var(--color-text)] mb-2">পেমেন্ট করার নিয়ম:</p>
              <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1">
                <li>নিচের যেকোনো নম্বরে Send Money করুন</li>
                <li>বিকাশ/নগদ/রকেট নম্বর: 01XXX-XXXXXX (Personal)</li>
                <li>পেমেন্ট করার পর Transaction ID নিচের ফর্মে দিন</li>
                <li>অ্যাডমিন আপনার পেমেন্ট যাচাই করে অ্যাকাউন্ট সক্রিয় করে দেবেন</li>
              </ul>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-xl font-bold mb-4">পেমেন্ট জমা দিন</h2>
            <form onSubmit={handleSubmitPayment}>
              <div className="form-group">
                <label className="label">পেমেন্ট মেথড</label>
                <div className="flex gap-4">
                  <label className={`flex-1 border rounded-lg p-3 cursor-pointer text-center transition-colors ${method === 'bkash' ? 'border-[#e2136e] bg-[#e2136e]/10' : 'border-[var(--color-border)] hover:bg-[var(--color-surface)]'}`}>
                    <input type="radio" name="method" value="bkash" className="hidden" checked={method === 'bkash'} onChange={() => setMethod('bkash')} />
                    <span className="font-bold text-[#e2136e]">bKash 🦅</span>
                  </label>
                  <label className={`flex-1 border rounded-lg p-3 cursor-pointer text-center transition-colors ${method === 'nagad' ? 'border-[#ed1c24] bg-[#ed1c24]/10' : 'border-[var(--color-border)] hover:bg-[var(--color-surface)]'}`}>
                    <input type="radio" name="method" value="nagad" className="hidden" checked={method === 'nagad'} onChange={() => setMethod('nagad')} />
                    <span className="font-bold text-[#ed1c24]">Nagad 💸</span>
                  </label>
                  <label className={`flex-1 border rounded-lg p-3 cursor-pointer text-center transition-colors ${method === 'rocket' ? 'border-[#8c1562] bg-[#8c1562]/10' : 'border-[var(--color-border)] hover:bg-[var(--color-surface)]'}`}>
                    <input type="radio" name="method" value="rocket" className="hidden" checked={method === 'rocket'} onChange={() => setMethod('rocket')} />
                    <span className="font-bold text-[#8c1562]">Rocket 🚀</span>
                  </label>
                </div>
              </div>
              <div className="form-group">
                <label className="label">অ্যামাউন্ট</label>
                <input type="text" className="input bg-[var(--color-bg)] cursor-not-allowed w-full p-2 border rounded" value="৳১,০০০" disabled />
              </div>
              <div className="form-group my-4">
                <label className="label">Transaction ID (TrxID)</label>
                <input type="text" className="input w-full p-2 border rounded" placeholder="উদা: 8HDF38DK2M" value={trxId} onChange={e => setTrxId(e.target.value)} required />
              </div>
              <button type="submit" disabled={submitting} className="btn btn-primary w-full">
                {submitting ? <span className="spinner" /> : 'পেমেন্ট জমা দিন'}
              </button>
            </form>
          </div>
        </div>

        {/* History */}
        <div>
          <div className="card h-full flex flex-col">
            <div className="p-6 border-b border-[var(--color-border)]">
              <h2 className="text-xl font-bold">পেমেন্ট হিস্ট্রি</h2>
            </div>
            <div className="p-0 flex-1 overflow-y-auto">
              {payments.length > 0 ? (
                <div className="table-wrap">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-[var(--color-surface)] border-b border-[var(--color-border)]">
                        <th className="p-4">তারিখ</th>
                        <th className="p-4">মেথড</th>
                        <th className="p-4">অ্যামাউন্ট</th>
                        <th className="p-4">স্ট্যাটাস</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map(payment => (
                        <tr key={payment.id} className="border-b border-[var(--color-border)] last:border-0 text-[var(--color-text)]">
                          <td className="p-4">{new Date(payment.created_at).toLocaleDateString('bn-BD')}</td>
                          <td className="p-4 capitalize font-semibold">{payment.payment_method}</td>
                          <td className="p-4">৳{payment.amount}</td>
                          <td className="p-4">
                            {payment.status === 'pending' && <span className="badge badge-warning">অপেক্ষমাণ</span>}
                            {payment.status === 'approved' && <span className="badge badge-success">অনুমোদিত</span>}
                            {payment.status === 'rejected' && <span className="badge badge-danger">বাতিল</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-[var(--color-text-muted)]">
                  কোনো পেমেন্ট রেকর্ড নেই
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
