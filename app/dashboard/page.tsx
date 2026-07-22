import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { PenTool, Zap, History, FileText, Calendar, Award } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: institution } = await supabase
    .from('institutions')
    .select('*')
    .eq('auth_user_id', user.id)
    .single()

  if (!institution) redirect('/auth/login')

  const { data: papers } = await supabase
    .from('generated_papers')
    .select('*')
    .eq('institution_id', institution.id)
    .order('created_at', { ascending: false })
    .limit(5)
    
  const trialDaysLeft = institution.trial_start_date ? Math.max(0, 7 - Math.floor((Date.now() - new Date(institution.trial_start_date).getTime()) / (1000 * 60 * 60 * 24))) : 0
  const { count: totalPapers } = await supabase
    .from('generated_papers')
    .select('*', { count: 'exact', head: true })
    .eq('institution_id', institution.id)

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      {/* Welcome Header */}
      <div className="page-header mb-8" style={{ paddingLeft: 0 }}>
        <h1 className="page-title" style={{ fontSize: '1.8rem', color: 'var(--color-primary-dark)' }}>
          আসসালামু আলাইকুম, {institution.name}
        </h1>
        <p className="page-subtitle">আপনার মাদ্রাসা প্রশ্নব্যাংক ড্যাশবোর্ড ওভারভিউ</p>
      </div>

      {/* Subscription Status Panel */}
      <div className="card mb-8 p-6" style={{ background: '#ffffff', borderLeft: '4px solid var(--color-primary)' }}>
        {institution.subscription_status === 'trial' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-text)' }}>🎁 ৭ দিনের ফ্রি ট্রায়াল</h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', marginTop: '2px' }}>
                  আপনার ট্রায়াল শেষ হতে আরও <strong>{trialDaysLeft} দিন</strong> বাকি আছে।
                </p>
              </div>
              <span className="badge badge-info" style={{ marginLeft: 'auto' }}>ফ্রি ট্রায়াল</span>
            </div>
            
            {/* Progress Bar */}
            <div style={{ width: '100%', height: '8px', background: '#e2e8e4', borderRadius: '4px', overflow: 'hidden', marginTop: '6px' }}>
              <div style={{ width: `${(trialDaysLeft / 7) * 100}%`, height: '100%', background: 'linear-gradient(90deg, var(--color-primary), var(--color-primary-light))', borderRadius: '4px' }} />
            </div>
          </div>
        )}

        {institution.subscription_status === 'active' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-success)' }}>✅ সক্রিয় সাবস্ক্রিপশন</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', marginTop: '2px' }}>
                মেয়াদ শেষ হবে: {institution.subscription_expiry ? new Date(institution.subscription_expiry).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
              </p>
            </div>
            <span className="badge badge-success" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>প্রিমিয়াম মেম্বার</span>
          </div>
        )}

        {(institution.subscription_status === 'expired' || institution.subscription_status === 'inactive') && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-danger)' }}>⚠️ মেয়াদোত্তীর্ণ সাবস্ক্রিপশন</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', marginTop: '2px' }}>
                আপনার সাবস্ক্রিপশনের মেয়াদ শেষ হয়ে গেছে। নতুন প্রশ্নপত্র তৈরি করতে অনুগ্রহ করে নবায়ন করুন।
              </p>
            </div>
            <Link href="/dashboard/subscription" className="btn btn-danger" style={{ textDecoration: 'none' }}>
              সাবস্ক্রিপশন নবায়ন করুন
            </Link>
          </div>
        )}
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="stat-card" style={{ padding: '24px', background: 'white' }}>
          <div className="stat-icon" style={{ background: 'var(--color-primary-50)', color: 'var(--color-primary)' }}>
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="stat-value">{totalPapers || 0}টি</div>
            <div className="stat-label">মোট তৈরি প্রশ্নপত্র</div>
          </div>
        </div>

        <div className="stat-card" style={{ padding: '24px', background: 'white' }}>
          <div className="stat-icon" style={{ 
            background: institution.subscription_status === 'active' ? '#dcfce7' : '#dbeafe', 
            color: institution.subscription_status === 'active' ? 'var(--color-success)' : 'var(--color-info)' 
          }}>
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="stat-value" style={{ textTransform: 'capitalize' }}>
              {institution.subscription_status === 'trial' ? 'ট্রায়াল' : 
               institution.subscription_status === 'active' ? 'সক্রিয়' : 'বন্ধ'}
            </div>
            <div className="stat-label">প্যাকেজ স্ট্যাটাস</div>
          </div>
        </div>
      </div>

      {/* Main Interactive Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <Link href="/dashboard/create" className="card" style={{ 
          textDecoration: 'none', 
          padding: '32px 24px',
          background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)', 
          color: 'white',
          border: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '12px'
        }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>
            ✍️
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>ম্যানুয়াল প্রশ্নপত্র তৈরি</h3>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)', lineHeight: '1.5' }}>
            আপনার পছন্দ অনুযায়ী কিতাব ও অধ্যায়ভিত্তিক প্রশ্ন ম্যানুয়ালি বেছে নিয়ে প্রশ্নপত্র সাজান ও PDF ডাউনলোড করুন।
          </p>
        </Link>

        <Link href="/dashboard/auto-generate" className="card" style={{ 
          textDecoration: 'none', 
          padding: '32px 24px',
          background: 'linear-gradient(135deg, #7c590b 0%, var(--color-accent) 100%)', 
          color: 'white',
          border: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '12px'
        }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>
            ⚡
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>Auto Generate প্রশ্নপত্র</h3>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)', lineHeight: '1.5' }}>
            কিতাব ও অধ্যায়ের পাশে কতটি প্রশ্ন চান তা লিখে দিন, সিস্টেম স্বয়ংক্রিয়ভাবে সেকেন্ডের মধ্যে প্রশ্ন রেডি করবে।
          </p>
        </Link>
      </div>

      {/* Recent Generated Papers Table */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Calendar style={{ width: '20px', height: '20px', color: 'var(--color-primary)' }} />
        <h2 className="text-xl font-bold text-[var(--color-text)]" style={{ margin: 0 }}>সাম্প্রতিক প্রশ্নপত্রসমূহ</h2>
      </div>

      <div className="card" style={{ background: '#ffffff', overflow: 'hidden' }}>
        <div className="table-wrap" style={{ margin: 0, border: 'none' }}>
          <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f1f5f1', borderBottom: '1px solid var(--color-border)' }}>
                <th className="p-4 text-[var(--color-text)]" style={{ fontWeight: 600 }}>পরীক্ষার নাম</th>
                <th className="p-4 text-[var(--color-text)]" style={{ fontWeight: 600 }}>তৈরির তারিখ</th>
                <th className="p-4 text-[var(--color-text)]" style={{ fontWeight: 600 }}>মোট নম্বর</th>
                <th className="p-4 text-[var(--color-text)]" style={{ fontWeight: 600 }}>জেনারেশন মোড</th>
              </tr>
            </thead>
            <tbody>
              {papers && papers.length > 0 ? papers.map((paper: any) => (
                <tr key={paper.id} style={{ borderBottom: '1px solid var(--color-border)' }} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-semibold text-[var(--color-text)]">{paper.exam_name || 'পরীক্ষা'}</td>
                  <td className="p-4 text-[var(--color-text-muted)]">{new Date(paper.created_at).toLocaleDateString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                  <td className="p-4 text-[var(--color-text)]">{paper.total_marks}</td>
                  <td className="p-4">
                    <span className={`badge ${paper.mode === 'auto' ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '0.78rem' }}>
                      {paper.mode === 'auto' ? 'স্বয়ংক্রিয়' : 'ম্যানুয়াল'}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-[var(--color-text-muted)]" style={{ background: '#ffffff' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📄</div>
                    এখনো কোনো প্রশ্নপত্র তৈরি করা হয়নি।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
