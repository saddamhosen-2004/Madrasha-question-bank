'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Jamat, Kitab } from '@/types'
import toast from 'react-hot-toast'
import { Edit, Trash2, BookOpen, Users, XCircle } from 'lucide-react'

export default function KitabManagement() {
  const supabase = createClient()
  const [jamats, setJamats] = useState<Jamat[]>([])
  const [selectedJamatId, setSelectedJamatId] = useState<string>('')
  const [kitabs, setKitabs] = useState<Kitab[]>([])
  const [loading, setLoading] = useState(false)
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editKitab, setEditKitab] = useState<Kitab | null>(null)
  const [formData, setFormData] = useState({ name: '', jamat_id: '' })

  useEffect(() => {
    const fetchJamats = async () => {
      const { data } = await supabase.from('jamats').select('*').order('sort_order', { ascending: true })
      if (data) setJamats(data)
    }
    fetchJamats()
  }, [])

  useEffect(() => {
    if (selectedJamatId) fetchKitabs(selectedJamatId)
    else setKitabs([])
  }, [selectedJamatId])

  const fetchKitabs = async (jamatId: string) => {
    setLoading(true)
    const { data, error } = await supabase
      .from('kitabs')
      .select('*, jamat:jamats(name)')
      .eq('jamat_id', jamatId)
      .order('created_at', { ascending: true })
    
    if (error) toast.error('কিতাব লোড করতে সমস্যা হয়েছে')
    else setKitabs(data || [])
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editKitab) {
      const { error } = await supabase
        .from('kitabs')
        .update({ name: formData.name, jamat_id: formData.jamat_id })
        .eq('id', editKitab.id)
      if (error) toast.error('আপডেট করতে সমস্যা হয়েছে')
      else toast.success('কিতাব আপডেট করা হয়েছে')
    } else {
      const { error } = await supabase
        .from('kitabs')
        .insert([{ name: formData.name, jamat_id: formData.jamat_id }])
      if (error) toast.error('নতুন কিতাব যুক্ত করতে সমস্যা হয়েছে')
      else toast.success('নতুন কিতাব যুক্ত করা হয়েছে')
    }
    closeModal()
    if (formData.jamat_id === selectedJamatId) {
      fetchKitabs(selectedJamatId)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এটি মুছে ফেলতে চান?')) return
    const { error } = await supabase.from('kitabs').delete().eq('id', id)
    if (error) toast.error('মুছে ফেলতে সমস্যা হয়েছে')
    else {
      toast.success('মুছে ফেলা হয়েছে')
      if (selectedJamatId) fetchKitabs(selectedJamatId)
    }
  }

  const openModal = (kitab?: Kitab) => {
    if (kitab) {
      setEditKitab(kitab)
      setFormData({ name: kitab.name, jamat_id: kitab.jamat_id })
    } else {
      setEditKitab(null)
      setFormData({ name: '', jamat_id: selectedJamatId || (jamats[0]?.id ?? '') })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditKitab(null)
  }

  return (
    <div className="space-y-6">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">কিতাব ব্যবস্থাপনা</h1>
          <p className="page-subtitle">জামাত অনুযায়ী কিতাবের তালিকা</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>+ নতুন কিতাব</button>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
          <label className="font-bold" style={{ color: 'var(--color-text)', fontSize: '0.95rem' }}>জামাত নির্বাচন করুন:</label>
          <select 
            className="input"
            style={{ maxWidth: '280px', display: 'inline-block' }}
            value={selectedJamatId}
            onChange={(e) => setSelectedJamatId(e.target.value)}
          >
            <option value="">-- জামাত নির্বাচন করুন --</option>
            {jamats.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
          </select>
        </div>

        {selectedJamatId && (
          loading ? (
            <div className="flex justify-center py-8"><div className="spinner spinner-dark"></div></div>
          ) : kitabs.length === 0 ? (
            <div className="empty-state">এই জামাতের কোনো কিতাব পাওয়া যায়নি</div>
          ) : (
            <div className="table-wrap" style={{ marginTop: '16px' }}>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <th className="p-3">নাম</th>
                    <th className="p-3">জামাত</th>
                    <th className="p-3">তৈরির তারিখ</th>
                    <th className="p-3" style={{ textAlign: 'right' }}>অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {kitabs.map((kitab) => (
                    <tr key={kitab.id} className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                      <td className="p-3">{kitab.name}</td>
                      <td className="p-3">{kitab.jamat?.name}</td>
                      <td className="p-3">{new Date(kitab.created_at).toLocaleDateString('bn-BD')}</td>
                      <td className="p-3">
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', alignItems: 'center' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px' }}
                            title="সম্পাদনা" 
                            onClick={() => openModal(kitab)}
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            className="btn btn-danger" 
                            style={{ padding: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px' }}
                            title="মুছে ফেলুন" 
                            onClick={() => handleDelete(kitab.id)}
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
          )
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay fixed inset-0 bg-black/50 flex items-start justify-center z-50" style={{ padding: '24px 16px', overflowY: 'auto' }}>
          <div className="modal w-full max-w-md" style={{ backgroundColor: 'var(--color-surface)', borderRadius: '20px', boxShadow: '0 25px 60px rgba(0,0,0,0.25)', margin: 'auto' }}>

            {/* Blue Hero Header */}
            <div style={{ background: 'linear-gradient(135deg, #16a34a 0%, #14532d 100%)', padding: '24px 28px', position: 'relative' }}>
              <button
                type="button"
                onClick={closeModal}
                style={{ position: 'absolute', top: '14px', right: '14px', border: 'none', background: 'rgba(255,255,255,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', borderRadius: '50%', padding: '6px', color: 'white' }}
              >
                <XCircle size={20} />
              </button>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                <BookOpen size={26} color="white" />
              </div>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.72rem', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>কিতাব ব্যবস্থাপনা</p>
              <h3 style={{ color: 'white', fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
                {editKitab ? 'কিতাব এডিট করুন' : 'নতুন কিতাব যুক্ত করুন'}
              </h3>
            </div>

            {/* Form Body */}
            <div style={{ padding: '24px' }}>
              <form onSubmit={handleSubmit}>

                {/* Jamat select card */}
                <div style={{ background: '#f0fdf4', borderRadius: '14px', padding: '16px 18px', marginBottom: '14px', border: '1px solid #d1fae5' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Users size={15} color="white" />
                    </div>
                    <label style={{ fontWeight: 700, color: '#14532d', fontSize: '0.88rem' }}>জামাত</label>
                  </div>
                  <select
                    className="input w-full"
                    style={{ height: '42px', display: 'block', background: 'white', border: '1px solid #d1fae5' }}
                    required
                    value={formData.jamat_id}
                    onChange={e => setFormData({ ...formData, jamat_id: e.target.value })}
                  >
                    <option value="">-- জামাত নির্বাচন করুন --</option>
                    {jamats.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
                  </select>
                </div>

                {/* Kitab name card */}
                <div style={{ background: '#f0fdf4', borderRadius: '14px', padding: '16px 18px', marginBottom: '24px', border: '1px solid #d1fae5' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <BookOpen size={15} color="white" />
                    </div>
                    <label style={{ fontWeight: 700, color: '#14532d', fontSize: '0.88rem' }}>কিতাবের নাম</label>
                  </div>
                  <input
                    type="text"
                    className="input w-full"
                    style={{ height: '42px', display: 'block', background: 'white', border: '1px solid #d1fae5' }}
                    placeholder="কিতাবের নাম লিখুন (উদা: তাইসীরুল মুবতাদী)"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
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
                    style={{ flex: 1, padding: '11px', borderRadius: '10px', border: 'none', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', background: 'linear-gradient(135deg, #2563eb, #14532d)', color: 'white', fontFamily: 'inherit' }}
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

