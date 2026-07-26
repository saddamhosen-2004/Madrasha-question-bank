'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2, XCircle, HelpCircle } from 'lucide-react'
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
      {/* Colorful Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #052e16 0%, #0f5d34 50%, #16a34a 100%)',
        padding: '32px 32px 28px',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '0 0 24px 24px',
        boxShadow: '0 8px 32px rgba(15,93,52,0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ position: 'absolute', right: '-30px', top: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: '100px', bottom: '-60px', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 6px' }}>কন্টেন্ট ব্যবস্থাপনা</p>
          <h1 style={{ color: 'white', fontSize: '1.9rem', fontWeight: 800, margin: '0 0 6px' }}>প্রশ্ন ব্যাংক ব্যবস্থাপনা</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.88rem', margin: 0 }}>সব প্রশ্ন দেখুন, ফিল্টার করুন এবং নতুন প্রশ্ন যুক্ত করুন</p>
        </div>
        <button 
          className="btn" 
          style={{ 
            position: 'relative', 
            zIndex: 1, 
            background: 'white', 
            color: 'var(--color-primary-dark)', 
            fontWeight: 700, 
            boxShadow: '0 4px 14px rgba(255,255,255,0.25)', 
            border: 'none',
            padding: '12px 24px',
            borderRadius: '12px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }} 
          onClick={() => openModal()}
        >
          <Plus size={18} /> নতুন প্রশ্ন যুক্ত করুন
        </button>
      </div>

      {/* Filters */}
      <div className="card bg-gray-50/50" style={{ padding: '24px' }}>
        <h3 className="font-bold border-b" style={{ borderColor: 'var(--color-border)', paddingBottom: '10px', marginBottom: '18px', fontSize: '1.05rem', color: 'var(--color-text)' }}>ফিল্টার সমূহ</h3>
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

      <div className="card" style={{ padding: '24px' }}>
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
                  <th className="p-3" style={{ textAlign: 'right' }}>অ্যাকশন</th>
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
                    <td className="p-3">
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', alignItems: 'center' }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px' }}
                          title="সম্পাদনা" 
                          onClick={() => openModal(q)}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          className="btn btn-danger" 
                          style={{ padding: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px' }}
                          title="মুছে ফেলুন" 
                          onClick={() => handleDelete(q.id)}
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
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay fixed inset-0 bg-black/50 flex items-start justify-center z-50" style={{ overflowY: 'auto', padding: '24px 16px' }}>
          <div className="modal bg-white rounded-lg shadow-xl w-full max-w-3xl" style={{ backgroundColor: 'var(--color-surface)', borderRadius: '20px', boxShadow: '0 25px 60px rgba(0,0,0,0.25)', margin: 'auto' }}>

            {/* Purple Hero Header */}
            <div style={{ background: 'linear-gradient(135deg, #16a34a 0%, #14532d 100%)', padding: '24px 28px', position: 'sticky', top: 0, zIndex: 10 }}>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ position: 'absolute', top: '14px', right: '14px', border: 'none', background: 'rgba(255,255,255,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', borderRadius: '50%', padding: '6px', color: 'white' }}
              >
                <XCircle size={20} />
              </button>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                <HelpCircle size={26} color="white" />
              </div>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.72rem', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>প্রশ্ন ব্যবস্থাপনা</p>
              <h3 style={{ color: 'white', fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
                {editQuestion ? 'প্রশ্ন এডিট করুন' : 'নতুন প্রশ্ন যুক্ত করুন'}
              </h3>
            </div>

            <div className="modal-body" style={{ padding: '24px' }}>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ marginBottom: '20px' }}>
                  <div className="form-group mb-0">
                    <label className="label" style={{ fontWeight: 600, color: 'var(--color-text)', display: 'block', fontSize: '0.9rem' }}>জামাত</label>
                    <select className="input w-full" style={{ height: '42px', marginTop: '8px', display: 'block' }} required value={modalJamatId} onChange={e => setModalJamatId(e.target.value)}>
                      <option value="">নির্বাচন করুন</option>
                      {jamats.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group mb-0">
                    <label className="label" style={{ fontWeight: 600, color: 'var(--color-text)', display: 'block', fontSize: '0.9rem' }}>কিতাব</label>
                    <select className="input w-full" style={{ height: '42px', marginTop: '8px', display: 'block' }} required value={modalKitabId} onChange={e => setModalKitabId(e.target.value)} disabled={!modalJamatId}>
                      <option value="">নির্বাচন করুন</option>
                      {modalKitabs.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group mb-0">
                    <label className="label" style={{ fontWeight: 600, color: 'var(--color-text)', display: 'block', fontSize: '0.9rem' }}>চ্যাপ্টার</label>
                    <select className="input w-full" style={{ height: '42px', marginTop: '8px', display: 'block' }} required value={modalChapterId} onChange={e => setModalChapterId(e.target.value)} disabled={!modalKitabId}>
                      <option value="">নির্বাচন করুন</option>
                      {modalChapters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginBottom: '20px' }}>
                  <div className="form-group mb-0">
                    <label className="label" style={{ fontWeight: 600, color: 'var(--color-text)', display: 'block', fontSize: '0.9rem' }}>প্রশ্নের ধরন</label>
                    <div className="flex gap-4" style={{ marginTop: '8px', display: 'flex', alignItems: 'center', height: '42px', gap: '16px' }}>
                      <label className="flex items-center gap-2 cursor-pointer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                        <input type="radio" name="type" value="mcq" checked={formData.type === 'mcq'} onChange={() => setFormData({ ...formData, type: 'mcq' as QuestionType })} style={{ width: '16px', height: '16px' }} />
                        MCQ
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                        <input type="radio" name="type" value="written" checked={formData.type === 'written'} onChange={() => setFormData({ ...formData, type: 'written' as QuestionType })} style={{ width: '16px', height: '16px' }} />
                        লিখিত
                      </label>
                    </div>
                  </div>
                  <div className="form-group mb-0">
                    <label className="label" style={{ fontWeight: 600, color: 'var(--color-text)', display: 'block', fontSize: '0.9rem' }}>ভাষা</label>
                    <select className="input w-full" style={{ height: '42px', marginTop: '8px', display: 'block' }} value={formData.language} onChange={e => setFormData({ ...formData, language: e.target.value as QuestionLanguage })}>
                      <option value="bangla">বাংলা</option>
                      <option value="arabic">আরবি</option>
                      <option value="farsi">ফার্সি</option>
                      <option value="urdu">উর্দু</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="label" style={{ fontWeight: 600, color: 'var(--color-text)', display: 'block', fontSize: '0.9rem' }}>প্রশ্ন</label>
                  <textarea
                    required
                    className={`input w-full h-24 ${isRtl ? 'input-rtl' : ''}`}
                    style={{ marginTop: '8px', display: 'block' }}
                    dir={isRtl ? 'rtl' : 'ltr'}
                    value={formData.question_text}
                    onChange={e => setFormData({ ...formData, question_text: e.target.value })}
                  />
                </div>

                {formData.type === 'mcq' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded border" style={{ borderColor: 'var(--color-border)', marginBottom: '20px' }}>
                    {['a', 'b', 'c', 'd'].map((opt) => (
                      <div key={opt} className="form-group mb-0">
                        <label className="label uppercase" style={{ fontWeight: 600, color: 'var(--color-text)', display: 'block', fontSize: '0.85rem' }}>অপশন {opt === 'a' ? 'ক' : opt === 'b' ? 'খ' : opt === 'c' ? 'গ' : 'ঘ'}</label>
                        <input
                          required
                          type="text"
                          className={`input w-full ${isRtl ? 'input-rtl' : ''}`}
                          style={{ height: '42px', marginTop: '8px', display: 'block' }}
                          dir={isRtl ? 'rtl' : 'ltr'}
                          value={formData[`option_${opt}` as keyof typeof formData] as string}
                          onChange={e => setFormData({ ...formData, [`option_${opt}`]: e.target.value })}
                        />
                      </div>
                    ))}
                    <div className="form-group md:col-span-2 mb-0" style={{ marginTop: '8px' }}>
                      <label className="label text-green-700 font-bold" style={{ display: 'block', fontSize: '0.88rem' }}>সঠিক উত্তর</label>
                      <select className="input w-full" style={{ height: '42px', marginTop: '8px', display: 'block' }} value={formData.correct_answer} onChange={e => setFormData({ ...formData, correct_answer: e.target.value })}>
                        <option value="a">ক (Option A)</option>
                        <option value="b">খ (Option B)</option>
                        <option value="c">গ (Option C)</option>
                        <option value="d">ঘ (Option D)</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginBottom: '24px' }}>
                  <div className="form-group mb-0">
                    <label className="label" style={{ fontWeight: 600, color: 'var(--color-text)', display: 'block', fontSize: '0.9rem' }}>মার্কস</label>
                    <input
                      type="number"
                      required
                      min="0.5"
                      step="0.5"
                      className="input w-full"
                      style={{ height: '42px', marginTop: '8px', display: 'block' }}
                      value={formData.marks}
                      onChange={e => setFormData({ ...formData, marks: e.target.value })}
                    />
                  </div>
                  <div className="form-group mb-0">
                    <label className="label" style={{ fontWeight: 600, color: 'var(--color-text)', display: 'block', fontSize: '0.9rem' }}>কঠিনতা</label>
                    <select className="input w-full" style={{ height: '42px', marginTop: '8px', display: 'block' }} value={formData.difficulty} onChange={e => setFormData({ ...formData, difficulty: e.target.value as DifficultyLevel })}>
                      <option value="easy">সহজ (Easy)</option>
                      <option value="medium">মাঝারি (Medium)</option>
                      <option value="hard">কঠিন (Hard)</option>
                    </select>
                  </div>
                </div>

                <div className="modal-footer flex justify-end gap-2 pt-4 border-t" style={{ borderColor: 'var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '16px 0 0' }}>
                  <button type="button" className="btn btn-ghost" style={{ padding: '8px 18px', fontSize: '0.88rem' }} onClick={() => setIsModalOpen(false)}>বাতিল</button>
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

