import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function PapersPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: papers } = await supabase
    .from('generated_papers')
    .select(`
      *,
      jamat:jamats(name),
      kitab:kitabs(name)
    `)
    .eq('institution_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      {/* Colorful Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #052e16 0%, #0f5d34 50%, #16a34a 100%)',
        padding: '32px 32px 28px',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '0 0 24px 24px',
        boxShadow: '0 8px 32px rgba(15,93,52,0.3)',
        marginBottom: '28px'
      }}>
        <div style={{ position: 'absolute', right: '-30px', top: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: '100px', bottom: '-60px', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 6px' }}>ইউজার প্যানেল</p>
          <h1 style={{ color: 'white', fontSize: '1.9rem', fontWeight: 800, margin: '0 0 6px' }}>পেপার হিস্ট্রি</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.88rem', margin: 0 }}>আপনার তৈরি করা সকল প্রশ্নপত্রের তালিকা</p>
        </div>
      </div>

      <div className="card">
        {papers && papers.length > 0 ? (
          <div className="table-wrap">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)]">
                  <th className="p-4">পরীক্ষার নাম</th>
                  <th className="p-4">জামাত ও কিতাব</th>
                  <th className="p-4">তারিখ</th>
                  <th className="p-4">মোট মার্কস</th>
                  <th className="p-4">মোড</th>
                  <th className="p-4 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {papers.map(paper => (
                  <tr key={paper.id} className="border-b border-[var(--color-border)] last:border-0 text-[var(--color-text)]">
                    <td className="p-4 font-semibold">{paper.exam_name}</td>
                    <td className="p-4">
                      {paper.jamat?.name && paper.kitab?.name 
                        ? `${paper.jamat.name} - ${paper.kitab.name}`
                        : 'বিভিন্ন'
                      }
                    </td>
                    <td className="p-4">{new Date(paper.created_at).toLocaleDateString('bn-BD')}</td>
                    <td className="p-4 text-center">
                      <span className="badge badge-warning">{paper.total_marks}</span>
                    </td>
                    <td className="p-4">
                      <span className={`badge ${paper.mode === 'auto' ? 'badge-info' : 'badge-primary'}`}>
                        {paper.mode === 'auto' ? 'অটো' : 'ম্যানুয়াল'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {paper.pdf_url ? (
                        <a href={paper.pdf_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-secondary">ডাউনলোড</a>
                      ) : (
                        <span className="text-sm text-[var(--color-text-muted)]">লিংক নেই</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>আপনি এখনও কোনো প্রশ্নপত্র তৈরি করেননি।</p>
            <Link href="/dashboard/create" className="btn btn-primary mt-4">প্রশ্নপত্র তৈরি করুন</Link>
          </div>
        )}
      </div>
    </div>
  )
}
