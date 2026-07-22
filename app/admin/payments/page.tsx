'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { CheckCircle, XCircle } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

type Payment = {
  id: string
  institution_id: string
  amount: number
  method: string
  transaction_id: string
  status: string
  created_at: string
  institution?: {
    name: string
    email: string
  }
}

function PaymentsContent() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')

  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'pending' | 'verified' | 'rejected'>('pending')

  useEffect(() => {
    if (tabParam && ['pending', 'verified', 'rejected'].includes(tabParam)) {
      setActiveTab(tabParam as any)
    }
  }, [tabParam])

  useEffect(() => {
    fetchPayments()
  }, [activeTab])

  const fetchPayments = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('mq_payments')
      .select('*, institution:institutions(name, email)')
      .eq('status', activeTab)
      .order('created_at', { ascending: false })
    
    if (error) {
      toast.error('পেমেন্ট লোড করতে সমস্যা হয়েছে')
    } else {
      setPayments(data as Payment[] || [])
    }
    setLoading(false)
  }

  const handleVerify = async (payment: Payment) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই পেমেন্টটি যাচাইকৃত (Verify) করতে চান?')) return

    try {
      const { error: pErr } = await supabase.from('mq_payments').update({ status: 'verified' }).eq('id', payment.id)
      if (pErr) throw pErr

      const expiry = new Date()
      expiry.setFullYear(expiry.getFullYear() + 1)

      const { error: iErr } = await supabase.from('institutions').update({
        subscription_status: 'active',
        subscription_expiry: expiry.toISOString(),
        is_approved: true
      }).eq('id', payment.institution_id)
      if (iErr) throw iErr

      toast.success('পেমেন্ট সফলভাবে যাচাই করা হয়েছে')
      fetchPayments()
    } catch (err) {
      toast.error('যাচাইকরণে ত্রুটি হয়েছে')
    }
  }

  const handleReject = async (paymentId: string) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই পেমেন্টটি প্রত্যাখ্যান (Reject) করতে চান?')) return
    const { error } = await supabase.from('mq_payments').update({ status: 'rejected' }).eq('id', paymentId)
    if (error) toast.error('প্রত্যাখ্যানে সমস্যা হয়েছে')
    else {
      toast.success('পেমেন্ট প্রত্যাখ্যাত হয়েছে')
      fetchPayments()
    }
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">পেমেন্ট যাচাইকরণ</h1>
        <p className="page-subtitle">সাবস্ক্রিপশন পেমেন্ট ম্যানেজমেন্ট</p>
      </div>

      <div className="tabs flex space-x-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
        {(['pending', 'verified', 'rejected'] as const).map(tab => (
          <button 
            key={tab} 
            className={`tab-btn px-4 py-2 ${activeTab === tab ? 'border-b-2 border-[var(--color-primary)] font-bold text-[var(--color-primary)]' : 'text-gray-500'}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'pending' ? 'অপেক্ষমান' : tab === 'verified' ? 'যাচাইকৃত' : 'প্রত্যাখ্যাত'}
          </button>
        ))}
      </div>

      <div className="card">
        {loading ? (
          <div className="flex justify-center py-8"><div className="spinner"></div></div>
        ) : payments.length === 0 ? (
          <div className="empty-state">কোনো পেমেন্ট পাওয়া যায়নি</div>
        ) : (
          <div className="table-wrap">
            <table className="w-full text-left whitespace-nowrap">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <th className="p-3">প্রতিষ্ঠান নাম</th>
                  <th className="p-3">পরিমাণ (৳)</th>
                  <th className="p-3">পদ্ধতি</th>
                  <th className="p-3">Transaction ID</th>
                  <th className="p-3">তারিখ</th>
                  {activeTab === 'pending' && <th className="p-3 text-right">অ্যাকশন</th>}
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b hover:bg-gray-50 transition-colors" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="p-3">
                      <div className="font-medium">{payment.institution?.name || 'অজানা'}</div>
                      <div className="text-xs text-gray-500">{payment.institution?.email}</div>
                    </td>
                    <td className="p-3 font-semibold text-[var(--color-primary)]">৳{payment.amount}</td>
                    <td className="p-3 uppercase">{payment.method}</td>
                    <td className="p-3 font-mono text-sm">{payment.transaction_id || '-'}</td>
                    <td className="p-3">{new Date(payment.created_at).toLocaleDateString('bn-BD')}</td>
                    {activeTab === 'pending' && (
                      <td className="p-3 text-right space-x-2">
                        <button className="btn btn-sm btn-success inline-flex items-center gap-1" onClick={() => handleVerify(payment)}>
                          <CheckCircle size={14} /> যাচাই করুন
                        </button>
                        <button className="btn btn-sm btn-danger inline-flex items-center gap-1" onClick={() => handleReject(payment.id)}>
                          <XCircle size={14} /> বাতিল
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PaymentsManagement() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8"><div className="spinner spinner-dark" /></div>}>
      <PaymentsContent />
    </Suspense>
  )
}
