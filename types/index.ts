// ============================================================
// Madrasha Question Bank — TypeScript Types
// ============================================================

export type QuestionType = 'mcq' | 'written'
export type QuestionLanguage = 'bangla' | 'arabic' | 'farsi' | 'urdu'
export type DifficultyLevel = 'easy' | 'medium' | 'hard'
export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'blocked'
export type PaymentMethod = 'bkash' | 'nagad' | 'rocket' | 'manual'
export type PaymentStatus = 'pending' | 'verified' | 'rejected'
export type PaperMode = 'manual' | 'auto'

// ---- Content Tables ----

export interface Jamat {
  id: string
  name: string
  sort_order: number
  created_at: string
}

export interface Kitab {
  id: string
  jamat_id: string
  name: string
  created_at: string
  jamat?: Jamat
}

export interface Chapter {
  id: string
  kitab_id: string
  name: string
  sort_order: number
  created_at: string
  kitab?: Kitab
  question_count?: number
}

export interface MCQOptions {
  a: string
  b: string
  c: string
  d: string
}

export interface Question {
  id: string
  chapter_id: string
  type: QuestionType
  language: QuestionLanguage
  question_text: string
  options: MCQOptions | null
  correct_answer: string | null
  marks: number
  difficulty: DifficultyLevel
  created_at: string
  updated_at: string
  chapter?: Chapter
}

// ---- Institution ----

export interface Institution {
  id: string
  name: string
  email: string
  phone: string | null
  address: string | null
  logo_url: string | null
  subscription_status: SubscriptionStatus
  trial_start_date: string | null
  subscription_expiry: string | null
  is_approved: boolean
  auth_user_id: string | null
  created_at: string
}

// ---- Subscription & Payments ----

export interface MQSubscription {
  id: string
  institution_id: string
  plan: string
  amount: number
  start_date: string | null
  end_date: string | null
  payment_status: PaymentStatus
  created_at: string
}

export interface MQPayment {
  id: string
  institution_id: string
  amount: number
  method: PaymentMethod
  transaction_id: string | null
  status: PaymentStatus
  notes: string | null
  created_at: string
  institution?: Institution
}

// ---- Generated Papers ----

export interface SelectedQuestion extends Question {
  chapter_name?: string
}

export interface GeneratedPaper {
  id: string
  institution_id: string
  title: string
  exam_name: string | null
  exam_date: string | null
  time_allowed: string | null
  jamat_id: string | null
  kitab_id: string | null
  questions: SelectedQuestion[]
  total_marks: number
  mode: PaperMode
  created_at: string
  institution?: Institution
  jamat?: Jamat
  kitab?: Kitab
}

// ---- PDF Header Info ----

export interface PDFHeaderInfo {
  institution_name: string
  logo_url: string | null
  exam_name: string
  exam_date: string
  time_allowed: string
  total_marks: number
  class_name?: string
  kitab_name?: string
}

// ---- Admin ----

export interface AdminUser {
  id: string
  email: string
  auth_user_id: string
  created_at: string
}

// ---- Bulk Import ----

export interface BulkQuestionRow {
  jamat_name: string
  kitab_name: string
  chapter_name: string
  type: QuestionType
  language: QuestionLanguage
  question_text: string
  option_a?: string
  option_b?: string
  option_c?: string
  option_d?: string
  correct_answer?: string
  marks: number
  difficulty: DifficultyLevel
  row_number?: number
  error?: string
}

// ---- Stats (Admin Dashboard) ----

export interface AdminStats {
  total_questions: number
  total_institutions: number
  active_subscriptions: number
  pending_approvals: number
  pending_payments: number
}
