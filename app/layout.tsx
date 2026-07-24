import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export async function generateMetadata(): Promise<Metadata> {
  let title = 'মাদ্রাসা প্রশ্নব্যাংক | Madrasha Question Bank'
  let faviconUrl = '/favicon.ico'

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('site_settings')
      .select('site_name, site_favicon_url')
      .eq('id', 1)
      .single()

    if (data) {
      if (data.site_name) {
        title = data.site_name
      }
      if (data.site_favicon_url) {
        faviconUrl = data.site_favicon_url
      }
    }
  } catch (e) {
    // Ignore error
  }

  return {
    title,
    description: 'বাংলাদেশের মাদ্রাসাগুলোর জন্য সহজ ও দ্রুত প্রশ্নপত্র তৈরির অনলাইন সিস্টেম',
    keywords: 'মাদ্রাসা, প্রশ্নব্যাংক, question bank, madrasha, Bangladesh',
    icons: {
      icon: faviconUrl,
    },
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="bn">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&family=Noto+Sans+Bengali:wght@300;400;500;600;700&family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif",
              fontSize: '0.88rem',
            },
            success: {
              iconTheme: { primary: '#1a6b3c', secondary: 'white' },
            },
          }}
        />
      </body>
    </html>
  )
}
