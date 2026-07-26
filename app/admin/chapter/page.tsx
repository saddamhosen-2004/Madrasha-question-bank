'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Jamat, Kitab, Chapter } from '@/types'
import toast from 'react-hot-toast'
import { Edit, Trash2 } from 'lucide-react'

export default function ChapterManagement() {
  const supabase = createClient()
  const [jamats, setJamats] = useState<Jamat[]>([])
  const [selectedJamatId, setSelectedJamatId] = useState<string>('')
  const [kitabs, setKitabs] = useState<Kitab[]>([])
  const [selectedKitabId, setSelectedKitabId] = useState<string>('')
  
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(false)
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editChapter, setEditChapter] = useState<Chapter | null>(null)
  const [formData, setFormData] = useState({ name: '', sort_order: '', kitab_id: '' })

  useEffect(() => {
    const fetchJamats = async () => {
      const { data } = await supabase.from('jamats').select('*').order('sort_order', { ascending: true })
      if (data) setJamats(data)
    }
    fetchJamats()
  }, [])

  useEffect(() => {
    if (selectedJamatId) {
      supabase.from('kitabs').select('*').eq('jamat_id', selectedJamatId).order('created_at').then(({ data }) => {
        setKitabs(data || [])
        setSelectedKitabId('')
      })
    } else {
      setKitabs([])
      setSelectedKitabId('')
    }
  }, [selectedJamatId])

  useEffect(() => {
    if (selectedKitabId) fetchChapters(selectedKitabId)
    else setChapters([])
  }, [selectedKitabId])

  const fetchChapters = async (kitabId: string) => {
    setLoading(true)
    const { data, error } = await supabase
      .from('chapters')
      .select('*, kitab:kitabs(name)')
      .eq('kitab_id', kitabId)
      .order('sort_order', { ascending: true })
    
    if (error) toast.error('চ্যাপ্টার লোড করতে সমস্যা হয়েছে')
    else setChapters(data || [])
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      name: formData.name,
      sort_order: Number(formData.sort_order),
      kitab_id: formData.kitab_id
    }
    if (editChapter) {
      const { error } = await supabase.from('chapters').update(payload).eq('id', editChapter.id)
      if (error) toast.error('আপডেট করতে সমস্যা হয়েছে')
      else toast.success('চ্যাপ্টার আপডেট করা হয়েছে')
    } else {
      const { error } = await supabase.from('chapters').insert([payload])
      if (error) toast.error('নতুন চ্যাপ্টার যুক্ত করতে সমস্যা হয়েছে')
      else toast.success('নতুন চ্যাপ্টার যুক্ত করা হয়েছে')
    }
    closeModal()
    if (formData.kitab_id === selectedKitabId) fetchChapters(selectedKitabId)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এটি মুছে ফেলতে চান?')) return
    const { error } = await supabase.from('chapters').delete().eq('id', id)
    if (error) toast.error('মুছে ফেলতে সমস্যা হয়েছে')
    else {
      toast.success('মুছে ফেলা হয়েছে')
      if (selectedKitabId) fetchChapters(selectedKitabId)
    }
  }

  const openModal = (chapter?: Chapter) => {
    if (chapter) {
      setEditChapter(chapter)
      setFormData({ name: chapter.name, sort_order: String(chapter.sort_order), kitab_id: chapter.kitab_id })
    } else {
      setEditChapter(null)
      setFormData({ name: '', sort_order: '', kitab_id: selectedKitabId || (kitabs[0]?.id ?? '') })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditChapter(null)
  }

  return (
    <div className="space-y-6">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">চ্যাপ্টার ব্যবস্থাপনা</h1>
          <p className="page-subtitle">কিতাব অনুযায়ী চ্যাপ্টার তালিকা</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()} disabled={!selectedKitabId}>+ নতুন চ্যাপ্টার</button>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', marginBottom: '20px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="font-bold block" style={{ color: 'var(--color-text)', fontSize: '0.9rem', marginBottom: '6px' }}>জামাত:</label>
            <select 
              className="input"
              style={{ width: '240px', display: 'block' }}
              value={selectedJamatId}
              onChange={(e) => setSelectedJamatId(e.target.value)}
            >
              <option value="">-- জামাত --</option>
              {jamats.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="font-bold block" style={{ color: 'var(--color-text)', fontSize: '0.9rem', marginBottom: '6px' }}>কিতাব:</label>
            <select 
              className="input"
              style={{ width: '240px', display: 'block' }}
              value={selectedKitabId}
              onChange={(e) => setSelectedKitabId(e.target.value)}
              disabled={!selectedJamatId}
            >
              <option value="">-- কিতাব --</option>
              {kitabs.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
            </select>
          </div>
        </div>

        {selectedKitabId && (
          loading ? (
            <div className="flex justify-center py-8"><div className="spinner spinner-dark"></div></div>
          ) : chapters.length === 0 ? (
            <div className="empty-state">এই কিতাবের কোনো চ্যাপ্টার পাওয়া যায়নি</div>
          ) : (
            <div className="table-wrap" style={{ marginTop: '16px' }}>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <th className="p-3">ক্রম</th>
                    <th className="p-3">নাম</th>
                    <th className="p-3">কিতাব</th>
                    <th className="p-3" style={{ textAlign: 'right' }}>অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {chapters.map((chapter) => (
                    <tr key={chapter.id} className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                      <td className="p-3">{chapter.sort_order}</td>
                      <td className="p-3">{chapter.name}</td>
                      <td className="p-3">{chapter.kitab?.name}</td>
                      <td className="p-3">
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', alignItems: 'center' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px' }}
                            title="সম্পাদনা" 
                            onClick={() => openModal(chapter)}
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            className="btn btn-danger" 
                            style={{ padding: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px' }}
                            title="মুছে ফেলুন" 
                            onClick={() => handleDelete(chapter.id)}
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
              <h3 className="font-bold text-lg" style={{ fontSize: '1.2rem', color: 'var(--color-text)' }}>{editChapter ? 'চ্যাপ্টার এডিট করুন' : 'নতুন চ্যাপ্টার যুক্ত করুন'}</h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700" style={{ fontSize: '1.5rem', border: 'none', background: 'transparent', cursor: 'pointer' }}>&times;</button>
            </div>
            <div className="modal-body" style={{ padding: '24px 24px 24px' }}>
              <form onSubmit={handleSubmit}>
                <div className="form-group" style={{ marginBottom: '18px' }}>
                  <label className="label" style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: '10px', display: 'block', fontSize: '0.9rem' }}>কিতাব</label>
                  <select 
                    className="input w-full"
                    style={{ height: '42px', display: 'block' }}
                    required
                    value={formData.kitab_id}
                    onChange={e => setFormData({ ...formData, kitab_id: e.target.value })}
                  >
                    <option value="">-- কিতাব নির্বাচন করুন --</option>
                    {kitabs.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: '18px' }}>
                  <label className="label" style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: '10px', display: 'block', fontSize: '0.9rem' }}>চ্যাপ্টারের নাম</label>
                  <input
                    type="text"
                    className="input w-full"
                    style={{ height: '42px', display: 'block' }}
                    placeholder="চ্যাপ্টারের নাম লিখুন (উদা: ঈমান ও আকীদা)"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '26px' }}>
                  <label className="label" style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: '10px', display: 'block', fontSize: '0.9rem' }}>ক্রম (Sort Order)</label>
                  <input
                    type="number"
                    className="input w-full"
                    style={{ height: '42px', display: 'block' }}
                    placeholder="ক্রমিক সংখ্যা লিখুন (উদা: ১)"
                    required
                    value={formData.sort_order}
                    onChange={e => setFormData({ ...formData, sort_order: e.target.value })}
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
