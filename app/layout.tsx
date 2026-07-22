import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'মাদ্রাসা প্রশ্নব্যাংক | Madrasha Question Bank',
  description: 'বাংলাদেশের মাদ্রাসাগুলোর জন্য সহজ ও দ্রুত প্রশ্নপত্র তৈরির অনলাইন সিস্টেম',
  keywords: 'মাদ্রাসা, প্রশ্নব্যাংক, question bank, madrasha, Bangladesh',
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
