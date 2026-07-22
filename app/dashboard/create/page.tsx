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
      <div className="page-header mb-8">
        <h1 className="page-title">ম্যানুয়াল প্রশ্নপত্র তৈরি</h1>
        <p className="page-subtitle">আপনার পছন্দমতো প্রশ্ন নির্বাচন করে প্রশ্নপত্র তৈরি করুন</p>
      </div>

      <div className="card p-6 mb-8 flex gap-4">
        <div className="form-group flex-1">
          <label className="label">জামাত নির্বাচন করুন</label>
          <select className="input" value={selectedJamat} onChange={e => setSelectedJamat(e.target.value)}>
            <option value="">-- নির্বাচন করুন --</option>
            {jamats.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
          </select>
        </div>
        <div className="form-group flex-1">
          <label className="label">কিতাব নির্বাচন করুন</label>
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
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {chapters.map(chapter => (
                <div key={chapter.id} className="card p-4 cursor-pointer hover:border-[var(--color-primary)] transition-colors" onClick={() => openChapterModal(chapter)}>
                  <h3 className="font-bold text-lg mb-2 text-[var(--color-text)]">{chapter.name}</h3>
                  <div className="flex justify-between items-center mt-4">
                    <span className="badge badge-info">{chapter.question_count} টি প্রশ্ন</span>
                    <button className="btn btn-sm btn-ghost text-[var(--color-primary)]">প্রশ্ন দেখুন</button>
                  </div>
                  {basket.filter(q => q.chapter_id === chapter.id).length > 0 && (
                    <div className="mt-2 text-sm text-[var(--color-primary)] font-semibold">
                      {basket.filter(q => q.chapter_id === chapter.id).length} টি প্রশ্ন নির্বাচিত
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
          <div className="modal bg-[var(--color-surface)] w-full max-w-md rounded-xl shadow-2xl z-50">
            <div className="modal-header p-4 border-b border-[var(--color-border)] flex justify-between items-center">
              <h2 className="text-xl font-bold">পরীক্ষার তথ্য</h2>
              <button onClick={() => setShowHeaderModal(false)} className="text-[var(--color-text-muted)]">✕</button>
            </div>
            <div className="modal-body p-4 space-y-4">
              <div className="form-group">
                <label className="label">পরীক্ষার নাম</label>
                <input type="text" className="input w-full p-2 border rounded" placeholder="উদা: অর্ধবার্ষিক পরীক্ষা ২০২৪" value={examInfo.exam_name} onChange={e => setExamInfo({...examInfo, exam_name: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="label">তারিখ</label>
                <input type="text" className="input w-full p-2 border rounded" placeholder="উদা: ১২ জানুয়ারি ২০২৪" value={examInfo.exam_date} onChange={e => setExamInfo({...examInfo, exam_date: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="label">সময়</label>
                <input type="text" className="input w-full p-2 border rounded" placeholder="উদা: ১ ঘণ্টা" value={examInfo.time_allowed} onChange={e => setExamInfo({...examInfo, time_allowed: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="label">মোট মার্কস</label>
                <input type="number" className="input w-full p-2 border rounded bg-gray-100 cursor-not-allowed" value={currentTotalMarks} disabled />
              </div>
            </div>
            <div className="modal-footer p-4 border-t border-[var(--color-border)] flex justify-end gap-2">
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
        <div className="fixed bottom-0 left-[260px] right-0 bg-[var(--color-surface)] border-t border-[var(--color-border)] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-4 flex justify-between items-center z-20">
          <div>
            <span className="font-bold text-[var(--color-text)] mr-4">মোট নির্বাচিত: <span className="text-[var(--color-primary)] text-xl">{basket.length}</span> টি প্রশ্ন</span>
            <span className="font-bold text-[var(--color-text)]">মোট মার্কস: <span className="text-[var(--color-accent)] text-xl">{currentTotalMarks}</span></span>
          </div>
          <button onClick={() => setShowHeaderModal(true)} className="btn btn-primary btn-lg">
            প্রশ্নপত্র তৈরি করুন
          </button>
        </div>
      )}
    </div>
  )
}
