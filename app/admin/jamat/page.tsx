'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Jamat } from '@/types'
import toast from 'react-hot-toast'
import { Edit, Trash2, Users, Hash, XCircle } from 'lucide-react'

export default function JamatManagement() {
  const supabase = createClient()
  const [jamats, setJamats] = useState<Jamat[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editJamat, setEditJamat] = useState<Jamat | null>(null)
  const [formData, setFormData] = useState({ name: '', sort_order: '' })

  const fetchJamats = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('jamats').select('*').order('sort_order', { ascending: true })
    if (error) toast.error('জামাত লোড করতে সমস্যা হয়েছে')
    else setJamats(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchJamats()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editJamat) {
      const { error } = await supabase
        .from('jamats')
        .update({ name: formData.name, sort_order: Number(formData.sort_order) })
        .eq('id', editJamat.id)
      if (error) toast.error('আপডেট করতে সমস্যা হয়েছে')
      else toast.success('জামাত আপডেট করা হয়েছে')
    } else {
      const { error } = await supabase
        .from('jamats')
        .insert([{ name: formData.name, sort_order: Number(formData.sort_order) }])
      if (error) toast.error('নতুন জামাত যুক্ত করতে সমস্যা হয়েছে')
      else toast.success('নতুন জামাত যুক্ত করা হয়েছে')
    }
    closeModal()
    fetchJamats()
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এটি মুছে ফেলতে চান?')) return
    const { error } = await supabase.from('jamats').delete().eq('id', id)
    if (error) toast.error('মুছে ফেলতে সমস্যা হয়েছে')
    else {
      toast.success('মুছে ফেলা হয়েছে')
      fetchJamats()
    }
  }

  const openModal = (jamat?: Jamat) => {
    if (jamat) {
      setEditJamat(jamat)
      setFormData({ name: jamat.name, sort_order: String(jamat.sort_order) })
    } else {
      setEditJamat(null)
      setFormData({ name: '', sort_order: '' })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditJamat(null)
    setFormData({ name: '', sort_order: '' })
  }

  return (
    <div className="space-y-6">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">জামাত ব্যবস্থাপনা</h1>
          <p className="page-subtitle">সকল জামাতের তালিকা এবং ব্যবস্থাপনা</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>+ নতুন জামাত</button>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex justify-center py-8"><div className="spinner spinner-dark"></div></div>
        ) : jamats.length === 0 ? (
          <div className="empty-state">কোনো জামাত পাওয়া যায়নি</div>
        ) : (
          <div className="table-wrap">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <th className="p-3">ক্রম</th>
                  <th className="p-3">নাম</th>
                  <th className="p-3">তৈরির তারিখ</th>
                  <th className="p-3" style={{ textAlign: 'right' }}>অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {jamats.map((jamat) => (
                  <tr key={jamat.id} className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="p-3">{jamat.sort_order}</td>
                    <td className="p-3">{jamat.name}</td>
                    <td className="p-3">{new Date(jamat.created_at).toLocaleDateString('bn-BD')}</td>
                    <td className="p-3">
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', alignItems: 'center' }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px' }}
                          title="সম্পাদনা" 
                          onClick={() => openModal(jamat)}
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          className="btn btn-danger" 
                          style={{ padding: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px' }}
                          title="মুছে ফেলুন" 
                          onClick={() => handleDelete(jamat.id)}
                        >
                          <Trash2 size={14} />
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

      {isModalOpen && (
        <div className="modal-overlay fixed inset-0 bg-black/50 flex items-center justify-center z-50" style={{ padding: '16px' }}>
          <div className="modal w-full max-w-md" style={{ backgroundColor: 'var(--color-surface)', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.25)' }}>

            {/* Green Hero Header */}
            <div style={{ background: 'linear-gradient(135deg, #16a34a 0%, #14532d 100%)', padding: '24px 28px', position: 'relative' }}>
              <button
                type="button"
                onClick={closeModal}
                style={{ position: 'absolute', top: '14px', right: '14px', border: 'none', background: 'rgba(255,255,255,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', borderRadius: '50%', padding: '6px', color: 'white' }}
              >
                <XCircle size={20} />
              </button>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                <Users size={26} color="white" />
              </div>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.72rem', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>জামাত ব্যবস্থাপনা</p>
              <h3 style={{ color: 'white', fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
                {editJamat ? 'জামাত এডিট করুন' : 'নতুন জামাত যুক্ত করুন'}
              </h3>
            </div>

            {/* Form Body */}
            <div style={{ padding: '24px' }}>
              <form onSubmit={handleSubmit}>

                {/* নাম field card */}
                <div style={{ background: '#f0fdf4', borderRadius: '14px', padding: '16px 18px', marginBottom: '14px', border: '1px solid #d1fae5' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Users size={15} color="white" />
                    </div>
                    <label style={{ fontWeight: 700, color: '#14532d', fontSize: '0.88rem' }}>জামাতের নাম</label>
                  </div>
                  <input
                    type="text"
                    className="input w-full"
                    style={{ height: '42px', background: 'white', border: '1px solid #bbf7d0' }}
                    placeholder="জামাতের নাম লিখুন (উদা: ইবতিদায়ী প্রথম)"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                {/* Sort Order field card */}
                <div style={{ background: '#f0fdf4', borderRadius: '14px', padding: '16px 18px', marginBottom: '24px', border: '1px solid #d1fae5' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Hash size={15} color="white" />
                    </div>
                    <label style={{ fontWeight: 700, color: '#14532d', fontSize: '0.88rem' }}>ক্রম (Sort Order)</label>
                  </div>
                  <input
                    type="number"
                    className="input w-full"
                    style={{ height: '42px', background: 'white', border: '1px solid #bbf7d0' }}
                    placeholder="ক্রমিক সংখ্যা লিখুন (উদা: ১)"
                    required
                    value={formData.sort_order}
                    onChange={e => setFormData({ ...formData, sort_order: e.target.value })}
                  />
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', gap: '10px', paddingTop: '16px', borderTop: '1px solid #d1fae5' }}>
                  <button
                    type="button"
                    style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid #d1fae5', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', background: 'white', color: '#15803d', fontFamily: 'inherit' }}
                    onClick={closeModal}
                  >বাতিল</button>
                  <button
                    type="submit"
                    style={{ flex: 1, padding: '11px', borderRadius: '10px', border: 'none', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', background: 'linear-gradient(135deg, #16a34a, #14532d)', color: 'white', fontFamily: 'inherit' }}
                  >✓ সংরক্ষণ করুন</button>
                </div>

              </form>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
