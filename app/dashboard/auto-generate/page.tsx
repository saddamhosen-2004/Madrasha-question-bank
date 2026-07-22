'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function AutoGeneratePage() {
  const supabase = createClient()
  const [jamats, setJamats] = useState<any[]>([])
  const [kitabs, setKitabs] = useState<any[]>([])
  const [chapters, setChapters] = useState<any[]>([])
  
  const [selectedJamat, setSelectedJamat] = useState('')
  const [selectedKitab, setSelectedKitab] = useState('')
  const [chaptersLoading, setChaptersLoading] = useState(false)
  
  // Chapter selections for auto generate
  const [chapterSelections, setChapterSelections] = useState<Record<string, { selected: boolean, count: number }>>({})
  
  // Header Modal State
  const [showHeaderModal, setShowHeaderModal] = useState(false)
  const [headerInfo, setHeaderInfo] = useState({
    examName: '',
    examDate: '',
    examTime: '',
    totalMarks: 100 // user provides total marks for auto
  })
  const [generating, setGenerating] = useState(false)
  const [institution, setInstitution] = useState<any>(null)

  useEffect(() => {
    async function loadInstitution() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('institutions')
        .select('*')
        .eq('auth_user_id', user.id)
        .single()
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
      setChapterSelections({})
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
        
        // Init state
        const initialSelections: any = {}
        chapsWithCounts.forEach(ch => {
          initialSelections[ch.id] = { selected: false, count: 1 }
        })
        setChapterSelections(initialSelections)
      }
      setChaptersLoading(false)
    }
    loadChapters()
  }, [selectedKitab])

  const handleSelectionChange = (chapterId: string, field: 'selected' | 'count', value: any) => {
    setChapterSelections(prev => ({
      ...prev,
      [chapterId]: {
        ...prev[chapterId],
        [field]: value
      }
    }))
  }

  const validateSelections = () => {
    const selected = Object.entries(chapterSelections).filter(([_, v]) => v.selected)
    if (selected.length === 0) {
      toast.error('অন্তত একটি অধ্যায় নির্বাচন করুন')
      return false
    }
    
    for (const [chId, sel] of selected) {
      const ch = chapters.find(c => c.id === chId)
      if (sel.count > ch.question_count) {
        toast.error(`${ch.name} অধ্যায়ে পর্যাপ্ত প্রশ্ন নেই (সর্বোচ্চ: ${ch.question_count})`)
        return false
      }
      if (sel.count < 1) {
        toast.error(`${ch.name} অধ্যায় থেকে অন্তত ১টি প্রশ্ন নির্বাচন করুন`)
        return false
      }
    }
    return true
  }

  const openHeaderModal = () => {
    if (validateSelections()) {
      setShowHeaderModal(true)
    }
  }

  const handleGeneratePDF = async () => {
    if (!headerInfo.examName || !headerInfo.examDate || !headerInfo.examTime || !headerInfo.totalMarks) {
      toast.error('সব তথ্য পূরণ করুন')
      return
    }
    setGenerating(true)
    
    try {
      // Gather selected chapters and requested counts
      const requests = Object.entries(chapterSelections)
        .filter(([_, v]) => v.selected)
        .map(([id, v]) => ({ chapter_id: id, count: v.count }))
      
      // Fetch random questions for each chapter
      let allSelectedQuestions: any[] = []
      
      for (const req of requests) {
        const { data } = await supabase
          .from('questions')
          .select('*')
          .eq('chapter_id', req.chapter_id)
          
        if (data) {
          // Shuffle and pick req.count
          const shuffled = data.sort(() => 0.5 - Math.random())
          allSelectedQuestions = [...allSelectedQuestions, ...shuffled.slice(0, req.count)]
        }
      }
      
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions: allSelectedQuestions,
          headerInfo: {
            ...headerInfo,
            institution_name: institution?.name,
            logo_url: institution?.logo_url,
          },
          mode: 'auto'
        })
      })
      
      if (!response.ok) throw new Error('PDF Generation Failed')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${headerInfo.examName}_AutoPaper.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      
      toast.success('PDF ডাউনলোড শুরু হয়েছে')
      setShowHeaderModal(false)
      setHeaderInfo({ examName: '', examDate: '', examTime: '', totalMarks: 100 })
      
      // Reset selections
      const resetSelections: any = {}
      chapters.forEach(ch => {
        resetSelections[ch.id] = { selected: false, count: 1 }
      })
      setChapterSelections(resetSelections)
      
    } catch (error) {
      toast.error('সমস্যা হয়েছে, আবার চেষ্টা করুন')
    }
    setGenerating(false)
  }

  const totalSelectedQuestions = Object.values(chapterSelections).filter(v => v.selected).reduce((sum, v) => sum + v.count, 0)

  return (
    <div className="pb-24">
      <div className="page-header mb-8">
        <h1 className="page-title">⚡ Auto Generate প্রশ্নপত্র</h1>
        <p className="page-subtitle">অধ্যায় এবং প্রশ্নের সংখ্যা উল্লেখ করুন, সিস্টেম স্বয়ংক্রিয়ভাবে প্রশ্ন নির্বাচন করবে</p>
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
          <div className="card p-6 mb-8">
            <h2 className="text-xl font-bold mb-4 text-[var(--color-text)]">অধ্যায়সমূহ থেকে প্রশ্ন নির্বাচন করুন</h2>
            <div className="space-y-4">
              {chapters.map(chapter => (
                <div key={chapter.id} className={`flex items-center gap-4 p-4 border rounded-lg transition-colors ${chapterSelections[chapter.id]?.selected ? 'border-[var(--color-primary)] bg-[var(--color-primary-50)]' : 'border-[var(--color-border)]'}`}>
                  <label className="checkbox-label flex items-center gap-3 flex-1 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={chapterSelections[chapter.id]?.selected || false}
                      onChange={e => handleSelectionChange(chapter.id, 'selected', e.target.checked)}
                    />
                    <div className="flex-1">
                      <div className="font-bold text-[var(--color-text)] text-lg">{chapter.name}</div>
                      <div className="text-sm text-[var(--color-text-muted)]">মোট উপলব্ধ প্রশ্ন: {chapter.question_count}</div>
                    </div>
                  </label>
                  
                  {chapterSelections[chapter.id]?.selected && (
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-semibold text-[var(--color-text)]">কয়টি প্রশ্ন:</label>
                      <input 
                        type="number" 
                        min="1" 
                        max={chapter.question_count}
                        className="input w-24" 
                        value={chapterSelections[chapter.id]?.count || 1}
                        onChange={e => handleSelectionChange(chapter.id, 'count', parseInt(e.target.value) || 1)}
                      />
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

      {/* Header Info Modal */}
      {showHeaderModal && (
        <div className="modal-overlay flex items-center justify-center p-4 z-50">
          <div className="modal bg-[var(--color-surface)] w-full max-w-md rounded-xl shadow-2xl">
            <div className="modal-header p-4 border-b border-[var(--color-border)] flex justify-between items-center">
              <h2 className="text-xl font-bold">পরীক্ষার তথ্য</h2>
              <button onClick={() => setShowHeaderModal(false)} className="text-[var(--color-text-muted)]">✕</button>
            </div>
            <div className="modal-body p-4 space-y-4">
              <div className="form-group">
                <label className="label">পরীক্ষার নাম</label>
                <input type="text" className="input" placeholder="উদা: বার্ষিক পরীক্ষা ২০২৪" value={headerInfo.examName} onChange={e => setHeaderInfo({...headerInfo, examName: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="label">তারিখ</label>
                <input type="text" className="input" placeholder="উদা: ১৫ ডিসেম্বর ২০২৪" value={headerInfo.examDate} onChange={e => setHeaderInfo({...headerInfo, examDate: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="label">সময়</label>
                <input type="text" className="input" placeholder="উদা: ৩ ঘণ্টা" value={headerInfo.examTime} onChange={e => setHeaderInfo({...headerInfo, examTime: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="label">মোট মার্কস (ঐচ্ছিক)</label>
                <input type="number" className="input" placeholder="উদা: ১০০" value={headerInfo.totalMarks} onChange={e => setHeaderInfo({...headerInfo, totalMarks: parseInt(e.target.value) || 0})} />
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
      {totalSelectedQuestions > 0 && (
        <div className="fixed bottom-0 left-[260px] right-0 bg-[var(--color-surface)] border-t border-[var(--color-border)] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-4 flex justify-between items-center z-20">
          <div>
            <span className="font-bold text-[var(--color-text)]">মোট চাওয়া হয়েছে: <span className="text-[var(--color-primary)] text-xl">{totalSelectedQuestions}</span> টি প্রশ্ন</span>
          </div>
          <button onClick={openHeaderModal} className="btn btn-secondary btn-lg">
            Generate করুন
          </button>
        </div>
      )}
    </div>
  )
}
