'use client'

import Link from 'next/link'

export default function HomePage() {
  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0d4022 0%, #1a6b3c 50%, #2a8a50 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute', top: '-20%', right: '-10%',
          width: '600px', height: '600px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-20%', left: '-10%',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.03)',
        }} />
      </div>

      <div style={{ textAlign: 'center', color: 'white', position: 'relative', zIndex: 1, maxWidth: '600px' }}>
        {/* Logo / Icon */}
        <div style={{
          width: '90px', height: '90px', borderRadius: '24px',
          background: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 28px',
          fontSize: '2.5rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}>
          📚
        </div>

        <h1 style={{
          fontSize: 'clamp(1.8rem, 5vw, 2.8rem)',
          fontWeight: 700,
          marginBottom: '12px',
          textShadow: '0 2px 12px rgba(0,0,0,0.2)',
        }}>
          মাদ্রাসা প্রশ্নব্যাংক
        </h1>

        <p style={{
          fontSize: '1rem',
          color: 'rgba(255,255,255,0.8)',
          marginBottom: '8px',
          lineHeight: '1.7',
        }}>
          জামাত ও কিতাব অনুযায়ী সহজেই প্রশ্নপত্র তৈরি করুন
        </p>
        <p style={{
          fontSize: '0.85rem',
          color: 'rgba(255,255,255,0.55)',
          marginBottom: '40px',
        }}>
          বাংলাদেশের মাদ্রাসাগুলোর জন্য বিশেষভাবে তৈরি
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/auth/login" style={{
            padding: '13px 32px',
            background: 'white',
            color: '#1a6b3c',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '0.95rem',
            textDecoration: 'none',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
            ;(e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(0,0,0,0.25)'
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
            ;(e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)'
          }}
          >
            লগইন করুন
          </Link>

          <Link href="/auth/register" style={{
            padding: '13px 32px',
            background: 'rgba(255,255,255,0.15)',
            color: 'white',
            borderRadius: '10px',
            fontWeight: 600,
            fontSize: '0.95rem',
            textDecoration: 'none',
            border: '1px solid rgba(255,255,255,0.3)',
            backdropFilter: 'blur(10px)',
          }}>
            নিবন্ধন করুন
          </Link>
        </div>

        {/* Features */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px', marginTop: '48px',
        }}>
          {[
            { icon: '✍️', text: 'Manual প্রশ্ন বাছাই' },
            { icon: '⚡', text: 'Auto Generate' },
            { icon: '📄', text: 'PDF Export' },
          ].map((f) => (
            <div key={f.text} style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '12px',
              padding: '16px 10px',
              backdropFilter: 'blur(10px)',
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>{f.icon}</div>
              <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{f.text}</div>
            </div>
          ))}
        </div>

        {/* Admin link */}
        <p style={{ marginTop: '32px', fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)' }}>
          <Link href="/admin/login" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>
            Admin Panel
          </Link>
        </p>
      </div>
    </main>
  )
}
