'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2, XCircle } from 'lucide-react'
import { Question, Jamat, Kitab, Chapter, QuestionType, QuestionLanguage, DifficultyLevel } from '@/types'

export default function QuestionsManagement() {
  const supabase = createClient()
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)
  
  // Filters
  const [jamats, setJamats] = useState<Jamat[]>([])
  const [filterJamatId, setFilterJamatId] = useState('')
  const [kitabs, setKitabs] = useState<Kitab[]>([])
  const [filterKitabId, setFilterKitabId] = useState('')
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [filterChapterId, setFilterChapterId] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterLang, setFilterLang] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editQuestion, setEditQuestion] = useState<Question | null>(null)
  
  const [modalJamatId, setModalJamatId] = useState('')
  const [modalKitabId, setModalKitabId] = useState('')
  const [modalChapterId, setModalChapterId] = useState('')
  const [modalKitabs, setModalKitabs] = useState<Kitab[]>([])
  const [modalChapters, setModalChapters] = useState<Chapter[]>([])

  const [formData, setFormData] = useState({
    type: 'mcq' as QuestionType,
    language: 'bangla' as QuestionLanguage,
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'a',
    marks: '1',
    difficulty: 'medium' as DifficultyLevel
  })

  useEffect(() => {
    supabase.from('jamats').select('*').order('sort_order').then(({ data }) => setJamats(data || []))
    fetchQuestions()
  }, [])

  // Cascade logic for Filters
  useEffect(() => {
    if (filterJamatId) {
      supabase.from('kitabs').select('*').eq('jamat_id', filterJamatId).order('created_at').then(({ data }) => setKitabs(data || []))
      setFilterKitabId('')
    } else {
      setKitabs([])
      setFilterKitabId('')
    }
  }, [filterJamatId])

  useEffect(() => {
    if (filterKitabId) {
      supabase.from('chapters').select('*').eq('kitab_id', filterKitabId).order('sort_order').then(({ data }) => setChapters(data || []))
      setFilterChapterId('')
    } else {
      setChapters([])
      setFilterChapterId('')
    }
  }, [filterKitabId])

  useEffect(() => {
    fetchQuestions()
  }, [filterJamatId, filterKitabId, filterChapterId, filterType, filterLang])

  const fetchQuestions = async () => {
    setLoading(true)
    let query = supabase.from('questions').select('*, chapter:chapters(name, kitab:kitabs(name, jamat:jamats(name)))').order('created_at', { ascending: false }).limit(100)
    
    if (filterChapterId) query = query.eq('chapter_id', filterChapterId)
    if (filterType) query = query.eq('type', filterType)
    if (filterLang) query = query.eq('language', filterLang)
    
    const { data, error } = await query
    if (error) {
      toast.error('প্রশ্ন লোড করতে সমস্যা হয়েছে')
    } else {
      let filteredData = data || []
      if (filterKitabId && !filterChapterId) {
        filteredData = filteredData.filter((q: any) => q.chapter?.kitab?.id === filterKitabId || q.chapter?.kitab?.name)
      }
      setQuestions(filteredData)
    }
    setLoading(false)
  }

  // Cascade logic for Modal
  useEffect(() => {
    if (modalJamatId) {
      supabase.from('kitabs').select('*').eq('jamat_id', modalJamatId).order('created_at').then(({ data }) => setModalKitabs(data || []))
    } else {
      setModalKitabs([])
      setModalKitabId('')
    }
  }, [modalJamatId])

  useEffect(() => {
    if (modalKitabId) {
      supabase.from('chapters').select('*').eq('kitab_id', modalKitabId).order('sort_order').then(({ data }) => setModalChapters(data || []))
    } else {
      setModalChapters([])
      setModalChapterId('')
    }
  }, [modalKitabId])

  const openModal = async (question?: any) => {
    if (question) {
      setEditQuestion(question)
      const { data: chData } = await supabase.from('chapters').select('kitab_id').eq('id', question.chapter_id).single()
      const kitabId = chData?.kitab_id
      
      const { data: ktData } = await supabase.from('kitabs').select('jamat_id').eq('id', kitabId).single()
      const jamatId = ktData?.jamat_id
      
      setModalJamatId(jamatId || '')
      
      const { data: kbs } = await supabase.from('kitabs').select('*').eq('jamat_id', jamatId).order('created_at')
      setModalKitabs(kbs || [])
      setModalKitabId(kitabId || '')
      
      const { data: chs } = await supabase.from('chapters').select('*').eq('kitab_id', kitabId).order('sort_order')
      setModalChapters(chs || [])
      setModalChapterId(question.chapter_id)
      
      setFormData({
        type: question.type,
        language: question.language,
        question_text: question.question_text,
        option_a: question.options?.a || '',
        option_b: question.options?.b || '',
        option_c: question.options?.c || '',
        option_d: question.options?.d || '',
        correct_answer: question.correct_answer || 'a',
        marks: String(question.marks),
        difficulty: question.difficulty
      })
    } else {
      setEditQuestion(null)
      setModalJamatId('')
      setModalKitabId('')
      setModalChapterId('')
      setFormData({
        type: 'mcq',
        language: 'bangla',
        question_text: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_answer: 'a',
        marks: '1',
        difficulty: 'medium'
      })
    }
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('আপনি কি নিশ্চিত?')) return
    const { error } = await supabase.from('questions').delete().eq('id', id)
    if (error) toast.error('মুছতে সমস্যা হয়েছে')
    else {
      toast.success('মুছে ফেলা হয়েছে')
      fetchQuestions()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!modalChapterId) {
      toast.error('চ্যাপ্টার নির্বাচন করুন')
      return
    }

    const payload = {
      chapter_id: modalChapterId,
      type: formData.type,
      language: formData.language,
      question_text: formData.question_text,
      options: formData.type === 'mcq' ? { a: formData.option_a, b: formData.option_b, c: formData.option_c, d: formData.option_d } : null,
      correct_answer: formData.type === 'mcq' ? formData.correct_answer : null,
      marks: Number(formData.marks),
      difficulty: formData.difficulty
    }

    if (editQuestion) {
      const { error } = await supabase.from('questions').update(payload).eq('id', editQuestion.id)
      if (error) toast.error('আপডেটে সমস্যা হয়েছে')
      else toast.success('আপডেট করা হয়েছে')
    } else {
      const { error } = await supabase.from('questions').insert([payload])
      if (error) toast.error('সংরক্ষণে সমস্যা হয়েছে')
      else toast.success('নতুন প্রশ্ন যুক্ত করা হয়েছে')
    }
    setIsModalOpen(false)
    fetchQuestions()
  }

  const isRtl = ['arabic', 'farsi', 'urdu'].includes(formData.language)

  return (
    <div className="space-y-6">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">প্রশ্ন ব্যাংক ব্যবস্থাপনা</h1>
          <p className="page-subtitle">সব প্রশ্ন দেখুন, ফিল্টার করুন এবং নতুন প্রশ্ন যুক্ত করুন</p>
        </div>
        <button className="btn btn-primary inline-flex items-center gap-1" onClick={() => openModal()}>
          <Plus size={16} /> নতুন প্রশ্ন
        </button>
      </div>

      {/* Filters */}
      <div className="card space-y-4 bg-gray-50/50">
        <h3 className="font-bold border-b pb-2 mb-4" style={{ borderColor: 'var(--color-border)' }}>ফিল্টার সমূহ</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <select className="input" value={filterJamatId} onChange={e => setFilterJamatId(e.target.value)}>
            <option value="">সকল জামাত</option>
            {jamats.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
          </select>
          <select className="input" value={filterKitabId} onChange={e => setFilterKitabId(e.target.value)} disabled={!filterJamatId}>
            <option value="">সকল কিতাব</option>
            {kitabs.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
          </select>
          <select className="input" value={filterChapterId} onChange={e => setFilterChapterId(e.target.value)} disabled={!filterKitabId}>
            <option value="">সকল চ্যাপ্টার</option>
            {chapters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="input" value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">সকল ধরন</option>
            <option value="mcq">MCQ</option>
            <option value="written">লিখিত</option>
          </select>
          <select className="input" value={filterLang} onChange={e => setFilterLang(e.target.value)}>
            <option value="">সকল ভাষা</option>
            <option value="bangla">বাংলা</option>
            <option value="arabic">আরবি</option>
            <option value="farsi">ফার্সি</option>
            <option value="urdu">উর্দু</option>
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex justify-center py-8"><div className="spinner"></div></div>
        ) : questions.length === 0 ? (
          <div className="empty-state">কোনো প্রশ্ন পাওয়া যায়নি</div>
        ) : (
          <div className="table-wrap">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <th className="p-3">প্রশ্ন</th>
                  <th className="p-3">ধরন</th>
                  <th className="p-3">ভাষা</th>
                  <th className="p-3">মার্কস</th>
                  <th className="p-3">কঠিনতা</th>
                  <th className="p-3 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q: any) => (
                  <tr key={q.id} className="border-b hover:bg-gray-50 transition-colors" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="p-3">
                      <div className={`max-w-md truncate ${['arabic', 'farsi', 'urdu'].includes(q.language) ? 'text-right font-arabic text-xl' : ''}`} dir={['arabic', 'farsi', 'urdu'].includes(q.language) ? 'rtl' : 'ltr'}>
                        {q.question_text}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {q.chapter?.kitab?.jamat?.name} &gt; {q.chapter?.kitab?.name} &gt; {q.chapter?.name}
                      </div>
                    </td>
                    <td className="p-3 uppercase text-sm font-semibold">{q.type === 'mcq' ? 'MCQ' : 'লিখিত'}</td>
                    <td className="p-3 capitalize">{q.language === 'bangla' ? 'বাংলা' : q.language}</td>
                    <td className="p-3">{q.marks}</td>
                    <td className="p-3 capitalize">
                      <span className={`badge ${q.difficulty === 'easy' ? 'badge-success' : q.difficulty === 'medium' ? 'badge-warning' : 'badge-danger'}`}>
                        {q.difficulty === 'easy' ? 'সহজ' : q.difficulty === 'medium' ? 'মাঝারি' : 'কঠিন'}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button className="btn btn-sm btn-secondary inline-flex items-center gap-1" onClick={() => openModal(q)}>
                        <Edit2 size={14} /> এডিট
                      </button>
                      <button className="btn btn-sm btn-danger inline-flex items-center gap-1" onClick={() => handleDelete(q.id)}>
                        <Trash2 size={14} /> মুছুন
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
        <div className="modal-overlay fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-8">
          <div className="modal bg-white rounded-lg shadow-xl w-full max-w-3xl m-auto" style={{ backgroundColor: 'var(--color-surface)' }}>
            <div className="modal-header p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10" style={{ borderColor: 'var(--color-border)' }}>
              <h3 className="font-bold text-lg">{editQuestion ? 'প্রশ্ন এডিট করুন' : 'নতুন প্রশ্ন যুক্ত করুন'}</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <XCircle size={24} />
              </button>
            </div>
            <div className="modal-body p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="form-group mb-0">
                    <label className="label">জামাত</label>
                    <select className="input w-full" required value={modalJamatId} onChange={e => setModalJamatId(e.target.value)}>
                      <option value="">নির্বাচন করুন</option>
                      {jamats.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group mb-0">
                    <label className="label">কিতাব</label>
                    <select className="input w-full" required value={modalKitabId} onChange={e => setModalKitabId(e.target.value)} disabled={!modalJamatId}>
                      <option value="">নির্বাচন করুন</option>
                      {modalKitabs.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group mb-0">
                    <label className="label">চ্যাপ্টার</label>
                    <select className="input w-full" required value={modalChapterId} onChange={e => setModalChapterId(e.target.value)} disabled={!modalKitabId}>
                      <option value="">নির্বাচন করুন</option>
                      {modalChapters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group mb-0">
                    <label className="label">প্রশ্নের ধরন</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="type" value="mcq" checked={formData.type === 'mcq'} onChange={() => setFormData({ ...formData, type: 'mcq' as QuestionType })} />
                        MCQ
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="type" value="written" checked={formData.type === 'written'} onChange={() => setFormData({ ...formData, type: 'written' as QuestionType })} />
                        লিখিত
                      </label>
                    </div>
                  </div>
                  <div className="form-group mb-0">
                    <label className="label">ভাষা</label>
                    <select className="input w-full" value={formData.language} onChange={e => setFormData({ ...formData, language: e.target.value as QuestionLanguage })}>
                      <option value="bangla">বাংলা</option>
                      <option value="arabic">আরবি</option>
                      <option value="farsi">ফার্সি</option>
                      <option value="urdu">উর্দু</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="label">প্রশ্ন</label>
                  <textarea
                    required
                    className={`input w-full h-24 ${isRtl ? 'input-rtl' : ''}`}
                    dir={isRtl ? 'rtl' : 'ltr'}
                    value={formData.question_text}
                    onChange={e => setFormData({ ...formData, question_text: e.target.value })}
                  />
                </div>

                {formData.type === 'mcq' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded border" style={{ borderColor: 'var(--color-border)' }}>
                    {['a', 'b', 'c', 'd'].map((opt) => (
                      <div key={opt} className="form-group mb-0">
                        <label className="label uppercase">অপশন {opt === 'a' ? 'ক' : opt === 'b' ? 'খ' : opt === 'c' ? 'গ' : 'ঘ'}</label>
                        <input
                          required
                          type="text"
                          className={`input w-full ${isRtl ? 'input-rtl' : ''}`}
                          dir={isRtl ? 'rtl' : 'ltr'}
                          value={formData[`option_${opt}` as keyof typeof formData] as string}
                          onChange={e => setFormData({ ...formData, [`option_${opt}`]: e.target.value })}
                        />
                      </div>
                    ))}
                    <div className="form-group md:col-span-2 mb-0">
                      <label className="label text-green-700 font-bold">সঠিক উত্তর</label>
                      <select className="input w-full" value={formData.correct_answer} onChange={e => setFormData({ ...formData, correct_answer: e.target.value })}>
                        <option value="a">ক (Option A)</option>
                        <option value="b">খ (Option B)</option>
                        <option value="c">গ (Option C)</option>
                        <option value="d">ঘ (Option D)</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group mb-0">
                    <label className="label">মার্কস</label>
                    <input
                      type="number"
                      required
                      min="0.5"
                      step="0.5"
                      className="input w-full"
                      value={formData.marks}
                      onChange={e => setFormData({ ...formData, marks: e.target.value })}
                    />
                  </div>
                  <div className="form-group mb-0">
                    <label className="label">কঠিনতা</label>
                    <select className="input w-full" value={formData.difficulty} onChange={e => setFormData({ ...formData, difficulty: e.target.value as DifficultyLevel })}>
                      <option value="easy">সহজ (Easy)</option>
                      <option value="medium">মাঝারি (Medium)</option>
                      <option value="hard">কঠিন (Hard)</option>
                    </select>
                  </div>
                </div>

                <div className="modal-footer flex justify-end gap-2 pt-4 border-t mt-6" style={{ borderColor: 'var(--color-border)' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>বাতিল</button>
                  <button type="submit" className="btn btn-primary px-8">সংরক্ষণ করুন</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
