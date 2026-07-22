import { createClient } from '@/lib/supabase/server'
import { Institution } from '@/types'
import Link from 'next/link'
import { HelpCircle, School, Award, Users, AlertCircle, FileText } from 'lucide-react'

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Fetch counts
  const [
    { count: questionsCount },
    { count: institutionsCount },
    { count: activeCount },
    { count: pendingApproveCount },
    { count: pendingPaymentCount },
    { data: recentInstitutions },
  ] = await Promise.all([
    supabase.from('questions').select('*', { count: 'exact', head: true }),
    supabase.from('institutions').select('*', { count: 'exact', head: true }),
    supabase.from('institutions').select('*', { count: 'exact', head: true }).eq('subscription_status', 'active'),
    supabase.from('institutions').select('*', { count: 'exact', head: true }).eq('is_approved', false),
    supabase.from('mq_payments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('institutions').select('*').order('created_at', { ascending: false }).limit(5),
  ])

  return (
    <div style={{ animation: 'pageTransition 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}>
      <div className="page-header mb-8" style={{ paddingLeft: 0 }}>
        <h1 className="page-title" style={{ fontSize: '1.8rem', color: 'var(--color-primary-dark)' }}>অ্যাডমিন ড্যাশবোর্ড</h1>
        <p className="page-subtitle">সিস্টেমের সার্বিক অবস্থা এবং লাইভ পরিসংখ্যান ওভারভিউ</p>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link href="/admin/questions" style={{ textDecoration: 'none' }}>
          <div className="stat-card" style={{ padding: '24px', background: 'white', cursor: 'pointer' }}>
            <div className="stat-icon" style={{ background: 'var(--color-primary-50)', color: 'var(--color-primary)' }}>
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="stat-value">{questionsCount || 0}টি</div>
              <div className="stat-label">মোট প্রশ্ন ব্যাংক</div>
            </div>
          </div>
        </Link>

        <Link href="/admin/institutions?tab=all" style={{ textDecoration: 'none' }}>
          <div className="stat-card" style={{ padding: '24px', background: 'white', cursor: 'pointer' }}>
            <div className="stat-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
              <School className="w-6 h-6" />
            </div>
            <div>
              <div className="stat-value">{institutionsCount || 0}টি</div>
              <div className="stat-label">নিবন্ধিত মাদ্রাসা</div>
            </div>
          </div>
        </Link>

        <Link href="/admin/institutions?tab=active" style={{ textDecoration: 'none' }}>
          <div className="stat-card" style={{ padding: '24px', background: 'white', cursor: 'pointer' }}>
            <div className="stat-icon" style={{ background: '#dcfce7', color: 'var(--color-success)' }}>
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="stat-value">{activeCount || 0}টি</div>
              <div className="stat-label">সক্রিয় সাবস্ক্রিপশন</div>
            </div>
          </div>
        </Link>

        <Link href="/admin/institutions?tab=pending" style={{ textDecoration: 'none' }}>
          <div className="stat-card" style={{ padding: '24px', background: 'white', cursor: 'pointer' }}>
            <div className="stat-icon" style={{ background: '#fef3c7', color: 'var(--color-warning)' }}>
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="stat-value">{pendingApproveCount || 0}টি</div>
              <div className="stat-label">অনুমোদনের অপেক্ষায়</div>
            </div>
          </div>
        </Link>

        <Link href="/admin/payments?tab=pending" style={{ textDecoration: 'none' }}>
          <div className="stat-card" style={{ padding: '24px', background: 'white', cursor: 'pointer' }}>
            <div className="stat-icon" style={{ background: '#fee2e2', color: 'var(--color-danger)' }}>
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="stat-value">{pendingPaymentCount || 0}টি</div>
              <div className="stat-label">অপেক্ষমান পেমেন্ট</div>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Institutions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <FileText style={{ width: '20px', height: '20px', color: 'var(--color-primary)' }} />
        <h2 className="text-xl font-bold text-[var(--color-text)]" style={{ margin: 0 }}>সাম্প্রতিক প্রতিষ্ঠানসমূহ</h2>
      </div>

      <div className="card" style={{ background: '#ffffff', overflow: 'hidden' }}>
        <div className="table-wrap" style={{ margin: 0, border: 'none' }}>
          <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f1f5f1', borderBottom: '1px solid var(--color-border)' }}>
                <th className="p-4 text-[var(--color-text)]" style={{ fontWeight: 600 }}>নাম</th>
                <th className="p-4 text-[var(--color-text)]" style={{ fontWeight: 600 }}>ইমেইল</th>
                <th className="p-4 text-[var(--color-text)]" style={{ fontWeight: 600 }}>নিবন্ধনের তারিখ</th>
                <th className="p-4 text-[var(--color-text)]" style={{ fontWeight: 600 }}>স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody>
              {recentInstitutions?.map((inst: Institution) => (
                <tr key={inst.id} style={{ borderBottom: '1px solid var(--color-border)' }} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-semibold text-[var(--color-text)]">{inst.name}</td>
                  <td className="p-4 text-[var(--color-text-muted)]">{inst.email}</td>
                  <td className="p-4 text-[var(--color-text-muted)]">
                    {new Date(inst.created_at).toLocaleDateString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="p-4">
                    {inst.is_approved ? (
                      <span className="badge badge-success" style={{ fontSize: '0.78rem' }}>অনুমোদিত</span>
                    ) : (
                      <span className="badge badge-warning" style={{ fontSize: '0.78rem' }}>অনুমোদনের অপেক্ষায়</span>
                    )}
                  </td>
                </tr>
              ))}
              {!recentInstitutions?.length && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-[var(--color-text-muted)]" style={{ background: '#ffffff' }}>
                    কোনো তথ্য পাওয়া যায়নি
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
