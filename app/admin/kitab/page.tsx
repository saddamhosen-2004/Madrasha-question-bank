'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Jamat, Kitab } from '@/types'
import toast from 'react-hot-toast'
import { Edit, Trash2 } from 'lucide-react'

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
        <div className="modal-overlay fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="modal bg-white rounded-lg shadow-xl w-full max-w-md" style={{ backgroundColor: 'var(--color-surface)', overflow: 'hidden' }}>
            <div className="modal-header p-4 border-b flex justify-between items-center" style={{ borderColor: 'var(--color-border)', padding: '20px 24px' }}>
              <h3 className="font-bold text-lg" style={{ fontSize: '1.2rem', color: 'var(--color-text)' }}>{editKitab ? 'কিতাব এডিট করুন' : 'নতুন কিতাব যুক্ত করুন'}</h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700" style={{ fontSize: '1.5rem', border: 'none', background: 'transparent', cursor: 'pointer' }}>&times;</button>
            </div>
            <div className="modal-body" style={{ padding: '24px 24px 24px' }}>
              <form onSubmit={handleSubmit}>
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="label" style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: '10px', display: 'block', fontSize: '0.9rem' }}>জামাত</label>
                  <select 
                    className="input w-full"
                    style={{ height: '42px', display: 'block' }}
                    required
                    value={formData.jamat_id}
                    onChange={e => setFormData({ ...formData, jamat_id: e.target.value })}
                  >
                    <option value="">-- জামাত নির্বাচন করুন --</option>
                    {jamats.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: '26px' }}>
                  <label className="label" style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: '10px', display: 'block', fontSize: '0.9rem' }}>কিতাবের নাম</label>
                  <input
                    type="text"
                    className="input w-full"
                    style={{ height: '42px', display: 'block' }}
                    placeholder="কিতাবের নাম লিখুন (উদা: তাইসীরুল মুবতাদী)"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="modal-footer" style={{ padding: '16px 0 0', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button type="button" className="btn btn-ghost" style={{ padding: '8px 18px', fontSize: '0.88rem' }} onClick={closeModal}>বাতিল</button>
                  <button type="submit" className="btn btn-primary" style={{ padding: '8px 24px', fontSize: '0.88rem' }}>সংরক্ষণ করুন</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
