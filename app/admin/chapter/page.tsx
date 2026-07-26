'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Jamat, Kitab, Chapter } from '@/types'
import toast from 'react-hot-toast'
import { Edit, Trash2, Layers, BookOpen, Hash, XCircle } from 'lucide-react'

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
        <div className="modal-overlay fixed inset-0 bg-black/50 flex items-center justify-center z-50" style={{ padding: '16px' }}>
          <div className="modal w-full max-w-md" style={{ backgroundColor: 'var(--color-surface)', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.25)' }}>

            {/* Orange Hero Header */}
            <div style={{ background: 'linear-gradient(135deg, #16a34a 0%, #14532d 100%)', padding: '24px 28px', position: 'relative' }}>
              <button
                type="button"
                onClick={closeModal}
                style={{ position: 'absolute', top: '14px', right: '14px', border: 'none', background: 'rgba(255,255,255,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', borderRadius: '50%', padding: '6px', color: 'white' }}
              >
                <XCircle size={20} />
              </button>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                <Layers size={26} color="white" />
              </div>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.72rem', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>চ্যাপ্টার ব্যবস্থাপনা</p>
              <h3 style={{ color: 'white', fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
                {editChapter ? 'চ্যাপ্টার এডিট করুন' : 'নতুন চ্যাপ্টার যুক্ত করুন'}
              </h3>
            </div>

            {/* Form Body */}
            <div style={{ padding: '24px' }}>
              <form onSubmit={handleSubmit}>

                {/* Kitab select card */}
                <div style={{ background: '#f0fdf4', borderRadius: '14px', padding: '16px 18px', marginBottom: '12px', border: '1px solid #d1fae5' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <BookOpen size={15} color="white" />
                    </div>
                    <label style={{ fontWeight: 700, color: '#14532d', fontSize: '0.88rem' }}>কিতাব</label>
                  </div>
                  <select
                    className="input w-full"
                    style={{ height: '42px', display: 'block', background: 'white', border: '1px solid #d1fae5' }}
                    required
                    value={formData.kitab_id}
                    onChange={e => setFormData({ ...formData, kitab_id: e.target.value })}
                  >
                    <option value="">-- কিতাব নির্বাচন করুন --</option>
                    {kitabs.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                  </select>
                </div>

                {/* Chapter name card */}
                <div style={{ background: '#f0fdf4', borderRadius: '14px', padding: '16px 18px', marginBottom: '12px', border: '1px solid #d1fae5' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Layers size={15} color="white" />
                    </div>
                    <label style={{ fontWeight: 700, color: '#14532d', fontSize: '0.88rem' }}>চ্যাপ্টারের নাম</label>
                  </div>
                  <input
                    type="text"
                    className="input w-full"
                    style={{ height: '42px', display: 'block', background: 'white', border: '1px solid #d1fae5' }}
                    placeholder="চ্যাপ্টারের নাম লিখুন (উদা: ঈমান ও আকীদা)"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                {/* Sort order card */}
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
                    style={{ height: '42px', display: 'block', background: 'white', border: '1px solid #d1fae5' }}
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
                    style={{ flex: 1, padding: '11px', borderRadius: '10px', border: 'none', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', background: 'linear-gradient(135deg, #ea580c, #14532d)', color: 'white', fontFamily: 'inherit' }}
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

