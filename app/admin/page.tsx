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

      {/* Colorful Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #052e16 0%, #0f5d34 50%, #16a34a 100%)',
        padding: '32px 32px 28px',
        marginBottom: '28px',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '0 0 24px 24px',
        boxShadow: '0 8px 32px rgba(15,93,52,0.3)'
      }}>
        <div style={{ position: 'absolute', right: '-30px', top: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', right: '100px', bottom: '-60px', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 6px' }}>সুপার অ্যাডমিন</p>
          <h1 style={{ color: 'white', fontSize: '1.9rem', fontWeight: 800, margin: '0 0 6px' }}>অ্যাডমিন ড্যাশবোর্ড</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.88rem', margin: 0 }}>সিস্টেমের সার্বিক অবস্থা এবং লাইভ পরিসংখ্যান ওভারভিউ</p>
        </div>
      </div>

      {/* Grid Stats — colorful cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8" style={{ padding: '0 4px' }}>
        <Link href="/admin/questions" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)', borderRadius: '18px', padding: '22px 24px', cursor: 'pointer', boxShadow: '0 8px 24px rgba(124,58,237,0.35)', transition: 'transform 0.2s, box-shadow 0.2s', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <HelpCircle style={{ width: '26px', height: '26px', color: 'white' }} />
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'white', lineHeight: 1 }}>{questionsCount || 0}</div>
              <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.8)', marginTop: '4px', fontWeight: 500 }}>মোট প্রশ্ন ব্যাংক</div>
            </div>
          </div>
        </Link>

        <Link href="/admin/institutions?tab=all" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'linear-gradient(135deg, #0891b2 0%, #164e63 100%)', borderRadius: '18px', padding: '22px 24px', cursor: 'pointer', boxShadow: '0 8px 24px rgba(8,145,178,0.35)', transition: 'transform 0.2s, box-shadow 0.2s', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <School style={{ width: '26px', height: '26px', color: 'white' }} />
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'white', lineHeight: 1 }}>{institutionsCount || 0}</div>
              <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.8)', marginTop: '4px', fontWeight: 500 }}>নিবন্ধিত মাদ্রাসা</div>
            </div>
          </div>
        </Link>

        <Link href="/admin/institutions?tab=active" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'linear-gradient(135deg, #16a34a 0%, #14532d 100%)', borderRadius: '18px', padding: '22px 24px', cursor: 'pointer', boxShadow: '0 8px 24px rgba(22,163,74,0.35)', transition: 'transform 0.2s, box-shadow 0.2s', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Award style={{ width: '26px', height: '26px', color: 'white' }} />
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'white', lineHeight: 1 }}>{activeCount || 0}</div>
              <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.8)', marginTop: '4px', fontWeight: 500 }}>সক্রিয় সাবস্ক্রিপশন</div>
            </div>
          </div>
        </Link>

        <Link href="/admin/institutions?tab=pending" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #92400e 100%)', borderRadius: '18px', padding: '22px 24px', cursor: 'pointer', boxShadow: '0 8px 24px rgba(245,158,11,0.35)', transition: 'transform 0.2s, box-shadow 0.2s', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Users style={{ width: '26px', height: '26px', color: 'white' }} />
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'white', lineHeight: 1 }}>{pendingApproveCount || 0}</div>
              <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.8)', marginTop: '4px', fontWeight: 500 }}>অনুমোদনের অপেক্ষায়</div>
            </div>
          </div>
        </Link>

        <Link href="/admin/payments?tab=pending" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'linear-gradient(135deg, #ea580c 0%, #7c2d12 100%)', borderRadius: '18px', padding: '22px 24px', cursor: 'pointer', boxShadow: '0 8px 24px rgba(234,88,12,0.35)', transition: 'transform 0.2s, box-shadow 0.2s', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AlertCircle style={{ width: '26px', height: '26px', color: 'white' }} />
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'white', lineHeight: 1 }}>{pendingPaymentCount || 0}</div>
              <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.8)', marginTop: '4px', fontWeight: 500 }}>অপেক্ষমান পেমেন্ট</div>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Institutions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', padding: '0 4px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #0f5d34, #16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FileText style={{ width: '18px', height: '18px', color: 'white' }} />
        </div>
        <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text)' }}>সাম্প্রতিক প্রতিষ্ঠানসমূহ</h2>
      </div>

      <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
        <div className="table-wrap" style={{ margin: 0, border: 'none' }}>
          <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th className="p-4">নাম</th>
                <th className="p-4">ইমেইল</th>
                <th className="p-4">নিবন্ধনের তারিখ</th>
                <th className="p-4">স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody>
              {recentInstitutions?.map((inst: Institution) => (
                <tr key={inst.id}>
                  <td className="p-4" style={{ fontWeight: 600 }}>{inst.name}</td>
                  <td className="p-4" style={{ color: 'var(--color-text-muted)' }}>{inst.email}</td>
                  <td className="p-4" style={{ color: 'var(--color-text-muted)' }}>
                    {new Date(inst.created_at).toLocaleDateString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="p-4">
                    {inst.is_approved ? (
                      <span className="badge badge-success" style={{ fontSize: '0.78rem' }}>✓ অনুমোদিত</span>
                    ) : (
                      <span className="badge badge-warning" style={{ fontSize: '0.78rem' }}>⏳ অপেক্ষায়</span>
                    )}
                  </td>
                </tr>
              ))}
              {!recentInstitutions?.length && (
                <tr>
                  <td colSpan={4} className="p-8 text-center" style={{ color: 'var(--color-text-muted)' }}>
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
