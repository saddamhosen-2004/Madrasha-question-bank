'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Jamat } from '@/types'
import toast from 'react-hot-toast'
import { Edit, Trash2 } from 'lucide-react'

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
                  <th className="p-3 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {jamats.map((jamat) => (
                  <tr key={jamat.id} className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="p-3">{jamat.sort_order}</td>
                    <td className="p-3">{jamat.name}</td>
                    <td className="p-3">{new Date(jamat.created_at).toLocaleDateString('bn-BD')}</td>
                    <td className="p-3 text-right space-x-2">
                      <button className="btn btn-sm btn-secondary btn-icon" title="সম্পাদনা" onClick={() => openModal(jamat)}>
                        <Edit size={16} />
                      </button>
                      <button className="btn btn-sm btn-danger btn-icon" title="মুছে ফেলুন" onClick={() => handleDelete(jamat.id)}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="modal bg-white rounded-lg shadow-xl w-full max-w-md" style={{ backgroundColor: 'var(--color-surface)' }}>
            <div className="modal-header p-4 border-b flex justify-between items-center" style={{ borderColor: 'var(--color-border)' }}>
              <h3 className="font-bold text-lg">{editJamat ? 'জামাত এডিট করুন' : 'নতুন জামাত যুক্ত করুন'}</h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">&times;</button>
            </div>
            <div className="modal-body p-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="form-group">
                  <label className="label">নাম</label>
                  <input
                    type="text"
                    className="input w-full"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="label">ক্রম (Sort Order)</label>
                  <input
                    type="number"
                    className="input w-full"
                    required
                    value={formData.sort_order}
                    onChange={e => setFormData({ ...formData, sort_order: e.target.value })}
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
