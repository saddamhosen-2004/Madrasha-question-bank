'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

type SelectedQuestion = {
  id: string
  question_text: string
  type: 'mcq' | 'written'
  marks: number
  options?: { a: string; b: string; c: string; d: string }
  difficulty: string
  language: string
  chapter_id?: string
}

export default function ManualCreatePage() {
  const supabase = createClient()
  const [institution, setInstitution] = useState<any>(null)
  
  const [jamats, setJamats] = useState<any[]>([])
  const [kitabs, setKitabs] = useState<any[]>([])
  const [chapters, setChapters] = useState<any[]>([])
  
  const [selectedJamat, setSelectedJamat] = useState<string>('')
  const [selectedKitab, setSelectedKitab] = useState<string>('')
  
  const [chaptersLoading, setChaptersLoading] = useState(false)
  
  // Chapter Modal State
  const [selectedChapter, setSelectedChapter] = useState<any>(null)
  const [chapterQuestions, setChapterQuestions] = useState<any[]>([])
  const [questionsLoading, setQuestionsLoading] = useState(false)
  const [tempSelection, setTempSelection] = useState<string[]>([]) 
  
  // Basket State
  const [basket, setBasket] = useState<SelectedQuestion[]>([])
  
  // Header Modal State
  const [showHeaderModal, setShowHeaderModal] = useState(false)
  const [examInfo, setExamInfo] = useState({
    exam_name: '',
    exam_date: '',
    time_allowed: '1 ঘণ্টা',
    total_marks: 0,
  })
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    const loadInstitution = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('institutions').select('*').eq('auth_user_id', user.id).single()
      setInstitution(data)
    }
    loadInstitution()
  }, [])

  useEffect(() => {
    async function loadJamats() {
      const { data } = await supabase.from('jamats').select('*').order('name')
      if (data) setJamats(data)
    }
    loadJamats()
  }, [])

  useEffect(() => {
    if (!selectedJamat) {
      setKitabs([])
      setSelectedKitab('')
      return
    }
    async function loadKitabs() {
      const { data } = await supabase.from('kitabs').select('*').eq('jamat_id', selectedJamat).order('name')
      if (data) setKitabs(data)
    }
    loadKitabs()
  }, [selectedJamat])

  useEffect(() => {
    if (!selectedKitab) {
      setChapters([])
      return
    }
    async function loadChapters() {
      setChaptersLoading(true)
      const { data: chaps } = await supabase.from('chapters').select('*').eq('kitab_id', selectedKitab).order('name')
      
      if (chaps) {
        const chapsWithCounts = await Promise.all(chaps.map(async (ch) => {
          const { count } = await supabase.from('questions').select('*', { count: 'exact', head: true }).eq('chapter_id', ch.id)
          return { ...ch, question_count: count || 0 }
        }))
        setChapters(chapsWithCounts)
      }
      setChaptersLoading(false)
    }
    loadChapters()
  }, [selectedKitab])

  const openChapterModal = async (chapter: any) => {
    setSelectedChapter(chapter)
    setQuestionsLoading(true)
    const { data } = await supabase.from('questions').select('*').eq('chapter_id', chapter.id)
    if (data) {
      setChapterQuestions(data)
    }
    setTempSelection(basket.filter(q => q.chapter_id === chapter.id).map(q => q.id))
    setQuestionsLoading(false)
  }

  const handleConfirmSelection = () => {
    const otherQuestions = basket.filter(q => q.chapter_id !== selectedChapter.id)
    const newSelectedQuestions = chapterQuestions.filter(q => tempSelection.includes(q.id)) as SelectedQuestion[]
    setBasket([...otherQuestions, ...newSelectedQuestions])
    setSelectedChapter(null)
    toast.success('প্রশ্নগুলো নির্বাচিত হয়েছে')
  }

  const handleGeneratePDF = async () => {
    if (!institution) {
      toast.error('প্রতিষ্ঠান লোড হয়নি')
      return
    }
    if (!examInfo.exam_name || !examInfo.exam_date || !examInfo.time_allowed) {
      toast.error('সব তথ্য পূরণ করুন')
      return
    }
    setGenerating(true)
    try {
      const currentTotalMarks = basket.reduce((sum, q) => sum + (q.marks || 0), 0)
      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions: basket,
          header: {
            institution_name: institution.name,
            logo_url: institution.logo_url,
            exam_name: examInfo.exam_name,
            exam_date: examInfo.exam_date,
            time_allowed: examInfo.time_allowed,
            total_marks: currentTotalMarks,
          },
          institution_id: institution.id,
        }),
      })
      
      if (!res.ok) throw new Error('PDF Generation Failed')
      
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${examInfo.exam_name || 'question-paper'}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      
      toast.success('PDF ডাউনলোড শুরু হয়েছে')
      setShowHeaderModal(false)
      setBasket([])
      setExamInfo({ exam_name: '', exam_date: '', time_allowed: '1 ঘণ্টা', total_marks: 0 })
    } catch (error) {
      toast.error('সমস্যা হয়েছে, আবার চেষ্টা করুন')
    }
    setGenerating(false)
  }

  const currentTotalMarks = basket.reduce((sum, q) => sum + (q.marks || 0), 0)

  return (
    <div className="pb-24">
      {/* Colorful Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #052e16 0%, #0f5d34 50%, #16a34a 100%)',
        padding: '32px 32px 28px',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '0 0 24px 24px',
        boxShadow: '0 8px 32px rgba(15,93,52,0.3)', marginBottom: '42px',
        }}>
        <div style={{ position: 'absolute', right: '-30px', top: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: '100px', bottom: '-60px', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 6px' }}>ইউজার প্যানেল</p>
          <h1 style={{ color: 'white', fontSize: '1.9rem', fontWeight: 800, margin: '0 0 6px' }}>ম্যানুয়াল প্রশ্নপত্র তৈরি</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.88rem', margin: 0 }}>আপনার পছন্দমতো প্রশ্ন নির্বাচন করে প্রশ্নপত্র তৈরি করুন</p>
        </div>
      </div>

      <div className="card mb-8 grid grid-cols-1 md:grid-cols-2 gap-6" style={{ padding: '24px' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="label" style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>জামাত নির্বাচন করুন</label>
          <select className="input" value={selectedJamat} onChange={e => setSelectedJamat(e.target.value)}>
            <option value="">-- নির্বাচন করুন --</option>
            {jamats.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="label" style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>কিতাব নির্বাচন করুন</label>
          <select className="input" value={selectedKitab} onChange={e => setSelectedKitab(e.target.value)} disabled={!selectedJamat}>
            <option value="">-- নির্বাচন করুন --</option>
            {kitabs.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
          </select>
        </div>
      </div>

      {chaptersLoading ? (
        <div className="flex justify-center p-8"><div className="spinner spinner-dark" /></div>
      ) : (
        selectedKitab && chapters.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4 text-[var(--color-text)]">অধ্যায়সমূহ</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
              {chapters.map(chapter => (
                <div key={chapter.id} className="card p-5 cursor-pointer hover:border-[var(--color-primary)] transition-colors w-full bg-[var(--color-surface)]" onClick={() => openChapterModal(chapter)}>
                  <h3 className="font-bold text-lg mb-2 text-[var(--color-text)]" style={{ margin: '0 0 8px' }}>{chapter.name}</h3>
                  <div className="flex justify-between items-center mt-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="badge badge-info">{chapter.question_count} টি প্রশ্ন</span>
                    <button className="btn btn-sm btn-ghost text-[var(--color-primary)]" style={{ fontSize: '0.82rem', padding: '6px 12px' }}>প্রশ্ন দেখুন</button>
                  </div>
                  {basket.filter(q => q.chapter_id === chapter.id).length > 0 && (
                    <div className="mt-3 text-sm text-[var(--color-primary)] font-bold" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      ✨ {basket.filter(q => q.chapter_id === chapter.id).length} টি প্রশ্ন নির্বাচিত
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {selectedKitab && chapters.length === 0 && !chaptersLoading && (
        <div className="empty-state">
          <p>এই কিতাবে কোনো অধ্যায় নেই।</p>
        </div>
      )}

      {/* Chapter Modal */}
      {selectedChapter && (
        <div className="modal-overlay flex items-center justify-center p-4">
          <div className="modal bg-[var(--color-surface)] w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl shadow-2xl">
            <div className="modal-header p-4 border-b border-[var(--color-border)] flex justify-between items-center">
              <h2 className="text-xl font-bold text-[var(--color-text)]">{selectedChapter.name} - প্রশ্নসমূহ</h2>
              <button onClick={() => setSelectedChapter(null)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">✕</button>
            </div>
            <div className="modal-body p-4 overflow-y-auto flex-1">
              {questionsLoading ? (
                <div className="flex justify-center p-8"><div className="spinner spinner-dark" /></div>
              ) : chapterQuestions.length > 0 ? (
                <div className="space-y-3">
                  {chapterQuestions.map(q => {
                    const isRtl = ['arabic', 'farsi', 'urdu'].includes(q.language)
                    return (
                      <label key={q.id} className="checkbox-label flex items-start gap-3 p-3 border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-primary-50)] cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="mt-1"
                          checked={tempSelection.includes(q.id)}
                          onChange={(e) => {
                            if (e.target.checked) setTempSelection([...tempSelection, q.id])
                            else setTempSelection(tempSelection.filter(id => id !== q.id))
                          }}
                        />
                        <div className="flex-1">
                          <div dir={isRtl ? 'rtl' : 'ltr'} className={`text-[var(--color-text)] ${isRtl ? 'text-xl font-arabic' : ''}`}>
                            {q.question_text}
                          </div>
                          <div className="flex gap-2 mt-2">
                            <span className="badge badge-muted text-xs">{q.type}</span>
                            <span className="badge badge-warning text-xs">মান: {q.marks}</span>
                          </div>
                        </div>
                      </label>
                    )
                  })}
                </div>
              ) : (
                <div className="empty-state">কোনো প্রশ্ন নেই</div>
              )}
            </div>
            <div className="modal-footer p-4 border-t border-[var(--color-border)] flex justify-end gap-2 bg-[var(--color-surface)]">
              <button onClick={() => setSelectedChapter(null)} className="btn btn-ghost">বাতিল</button>
              <button onClick={handleConfirmSelection} className="btn btn-primary">নির্বাচন নিশ্চিত করুন ({tempSelection.length})</button>
            </div>
          </div>
        </div>
      )}

      {/* Header Info Modal */}
      {showHeaderModal && (
        <div className="modal-overlay flex items-center justify-center p-4">
          <div className="modal bg-[var(--color-surface)] w-full max-w-md rounded-xl shadow-2xl z-50 overflow-hidden" style={{ borderRadius: '16px' }}>
            {/* Modal Header with Green Gradient */}
            <div style={{
              background: 'linear-gradient(135deg, #16a34a 0%, #14532d 100%)',
              padding: '20px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>
              <h2 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>পরীক্ষার তথ্য</h2>
              <button onClick={() => setShowHeaderModal(false)} style={{ color: 'rgba(255,255,255,0.8)', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>
            
            <div className="modal-body p-6 space-y-4">
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="label" style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px', display: 'block' }}>পরীক্ষার নাম</label>
                <input type="text" className="input w-full" style={{ color: '#0e2015', fontWeight: 500 }} placeholder="উদা: অর্ধবার্ষিক পরীক্ষা ২০২৪" value={examInfo.exam_name} onChange={e => setExamInfo({...examInfo, exam_name: e.target.value})} />
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="label" style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px', display: 'block' }}>তারিখ</label>
                <input type="text" className="input w-full" style={{ color: '#0e2015', fontWeight: 500 }} placeholder="উদা: ১২ জানুয়ারি ২০২৪" value={examInfo.exam_date} onChange={e => setExamInfo({...examInfo, exam_date: e.target.value})} />
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="label" style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px', display: 'block' }}>সময়</label>
                <input type="text" className="input w-full" style={{ color: '#0e2015', fontWeight: 500 }} placeholder="উদা: ১ ঘণ্টা" value={examInfo.time_allowed} onChange={e => setExamInfo({...examInfo, time_allowed: e.target.value})} />
              </div>
              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label className="label" style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px', display: 'block' }}>মোট মার্কস</label>
                <input type="number" className="input w-full cursor-not-allowed" style={{ background: '#f1f5f9', color: '#1f2937', fontWeight: 600 }} value={currentTotalMarks} disabled />
              </div>
            </div>
            
            <div className="modal-footer p-4 border-t border-[var(--color-border)] flex justify-end gap-2 bg-[var(--color-surface)]" style={{ borderRadius: '0 0 16px 16px' }}>
              <button onClick={() => setShowHeaderModal(false)} className="btn btn-ghost">বাতিল</button>
              <button onClick={handleGeneratePDF} disabled={generating} className="btn btn-primary">
                {generating ? <span className="spinner" /> : 'PDF তৈরি করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Basket Bar */}
      {basket.length > 0 && (
        <div className="fixed bottom-0 left-0 md:left-[260px] right-0 bg-[var(--color-surface)] border-t border-[var(--color-border)] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-4 flex flex-col sm:flex-row justify-between items-center gap-3 z-20">
          <div className="text-center sm:text-left">
            <span className="font-bold text-[var(--color-text)] mr-4 block sm:inline-block">মোট নির্বাচিত: <span className="text-[var(--color-primary)] text-xl">{basket.length}</span> টি প্রশ্ন</span>
            <span className="font-bold text-[var(--color-text)]">মোট মার্কস: <span className="text-[var(--color-accent)] text-xl">{currentTotalMarks}</span></span>
          </div>
          <button onClick={() => setShowHeaderModal(true)} className="btn btn-primary w-full sm:w-auto btn-lg">
            প্রশ্নপত্র তৈরি করুন
          </button>
        </div>
      )}
    </div>
  )
}
