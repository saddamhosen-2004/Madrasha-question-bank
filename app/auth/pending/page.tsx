import Link from 'next/link'

export default function PendingPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0d4022 0%, #1a6b3c 60%, #2a8a50 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '460px',
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        padding: '48px 40px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '20px' }}>⏳</div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '12px', color: 'var(--color-text)' }}>
          অনুমোদনের অপেক্ষায়
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: '1.7', marginBottom: '24px' }}>
          আপনার নিবন্ধন সফল হয়েছে। অ্যাডমিন আপনার অ্যাকাউন্ট অনুমোদন করলে আপনি লগইন করতে পারবেন।
          সাধারণত ২৪ ঘণ্টার মধ্যে অনুমোদন দেওয়া হয়।
        </p>

        <div className="alert alert-info" style={{ textAlign: 'left', marginBottom: '24px' }}>
          <span>📧</span>
          অনুমোদনের পর আপনার ইমেইলে জানানো হবে।
        </div>

        <Link href="/auth/login" className="btn btn-secondary" style={{ display: 'inline-flex' }}>
          লগইন পেজে যান
        </Link>
      </div>
    </div>
  )
}
