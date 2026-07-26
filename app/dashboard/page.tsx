import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { PenTool, Zap, History, FileText, Calendar, Award } from 'lucide-react'

function getTrialDaysLeft(trialStartDate: string | null): number {
  if (!trialStartDate) return 0
  const start = new Date(trialStartDate).getTime()
  const now = new Date().getTime()
  return Math.max(0, 7 - Math.floor((now - start) / (1000 * 60 * 60 * 24)))
}

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
    
  const trialDaysLeft = getTrialDaysLeft(institution.trial_start_date)
  const { count: totalPapers } = await supabase
    .from('generated_papers')
    .select('*', { count: 'exact', head: true })
    .eq('institution_id', institution.id)

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      {/* Welcome Header */}
      {/* Colorful Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #052e16 0%, #0f5d34 50%, #16a34a 100%)',
        padding: '32px 32px 28px',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '0 0 24px 24px',
        boxShadow: '0 8px 32px rgba(15,93,52,0.3)', marginBottom: '20px',
        }}>
        <div style={{ position: 'absolute', right: '-30px', top: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: '100px', bottom: '-60px', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 6px' }}>স্বাগতম</p>
          <h1 style={{ color: 'white', fontSize: '1.9rem', fontWeight: 800, margin: '0 0 6px' }}>
            আসসালামু আলাইকুম, {institution.name}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.88rem', margin: 0 }}>আপনার মাদ্রাসা প্রশ্নব্যাংক ড্যাশবোর্ড ওভারভিউ</p>
        </div>
      </div>

      {/* Subscription Status Panel */}
      <div className="card" style={{ 
        background: '#ffffff', 
        borderLeft: '4px solid var(--color-primary)',
        padding: institution.subscription_status === 'trial' ? '14px 20px' : '24px',
        marginBottom: '20px',
        }}>
        {institution.subscription_status === 'trial' && (
          <div style={{ textAlign: 'center', width: '100%' }}>
            <span style={{ color: 'var(--color-text)', fontSize: '0.95rem', fontWeight: 600 }}>
              🎁 আপনার ফ্রি ট্রায়াল শেষ হতে আরও <strong style={{ color: 'var(--color-primary)' }}>{trialDaysLeft} দিন</strong> বাকি আছে।
            </span>
          </div>
        )}

        {institution.subscription_status === 'active' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-success)', margin: 0 }}>✅ সক্রিয় সাবস্ক্রিপশন</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', margin: '2px 0 0' }}>
                মেয়াদ শেষ হবে: {institution.subscription_expiry ? new Date(institution.subscription_expiry).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
              </p>
            </div>
            <span className="badge badge-success" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>প্রিমিয়াম মেম্বার</span>
          </div>
        )}

        {(institution.subscription_status === 'expired' || institution.subscription_status === 'inactive') && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-danger)', margin: 0 }}>⚠️ মেয়াদোত্তীর্ণ সাবস্ক্রিপশন</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', margin: '2px 0 0' }}>
                আপনার সাবস্ক্রিপশনের মেয়াদ শেষ হয়ে গেছে। নতুন প্রশ্নপত্র তৈরি করতে অনুগ্রহ করে নবায়ন করুন।
              </p>
            </div>
            <Link href="/dashboard/subscription" className="btn btn-danger" style={{ textDecoration: 'none' }}>
              সাবস্ক্রিপশন নবায়ন করুন
            </Link>
          </div>
        )}
      </div>

      {/* Main Interactive Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '28px', marginBottom: '40px' }}>
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
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', margin: 0 }}>ম্যানুয়াল প্রশ্নপত্র তৈরি</h3>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)', lineHeight: '1.5', margin: 0 }}>
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
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', margin: 0 }}>Auto Generate প্রশ্নপত্র</h3>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)', lineHeight: '1.5', margin: 0 }}>
            কিতাব ও অধ্যায়ের পাশে কতটি প্রশ্ন চান তা লিখে দিন, সিস্টেম স্বয়ংক্রিয়ভাবে সেকেন্ডের মধ্যে প্রশ্ন রেডি করবে।
          </p>
        </Link>
      </div>

      {/* Recent Generated Papers Table */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
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
