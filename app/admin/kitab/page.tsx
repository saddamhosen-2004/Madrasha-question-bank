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

      <div className="card space-y-4">
        <div className="flex gap-4 items-center">
          <label className="font-bold">জামাত নির্বাচন করুন:</label>
          <select 
            className="input max-w-xs"
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
            <div className="table-wrap mt-4">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <th className="p-3">নাম</th>
                    <th className="p-3">জামাত</th>
                    <th className="p-3">তৈরির তারিখ</th>
                    <th className="p-3 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {kitabs.map((kitab) => (
                    <tr key={kitab.id} className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                      <td className="p-3">{kitab.name}</td>
                      <td className="p-3">{kitab.jamat?.name}</td>
                      <td className="p-3">{new Date(kitab.created_at).toLocaleDateString('bn-BD')}</td>
                      <td className="p-3 text-right space-x-2">
                        <button className="btn btn-sm btn-secondary btn-icon" title="সম্পাদনা" onClick={() => openModal(kitab)}>
                          <Edit size={16} />
                        </button>
                        <button className="btn btn-sm btn-danger btn-icon" title="মুছে ফেলুন" onClick={() => handleDelete(kitab.id)}>
                          <Trash2 size={16} />
                        </button>
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
          <div className="modal bg-white rounded-lg shadow-xl w-full max-w-md" style={{ backgroundColor: 'var(--color-surface)' }}>
            <div className="modal-header p-4 border-b flex justify-between items-center" style={{ borderColor: 'var(--color-border)' }}>
              <h3 className="font-bold text-lg">{editKitab ? 'কিতাব এডিট করুন' : 'নতুন কিতাব যুক্ত করুন'}</h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">&times;</button>
            </div>
            <div className="modal-body p-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="form-group">
                  <label className="label">জামাত</label>
                  <select 
                    className="input w-full"
                    required
                    value={formData.jamat_id}
                    onChange={e => setFormData({ ...formData, jamat_id: e.target.value })}
                  >
                    <option value="">-- নির্বাচন করুন --</option>
                    {jamats.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">কিতাবের নাম</label>
                  <input
                    type="text"
                    className="input w-full"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="modal-footer flex justify-end gap-2 pt-4">
                  <button type="button" className="btn btn-ghost" onClick={closeModal}>বাতিল</button>
                  <button type="submit" className="btn btn-primary">সংরক্ষণ করুন</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
