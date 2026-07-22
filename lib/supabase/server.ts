import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url || url.trim() === '') {
    url = 'https://placeholder.supabase.co'
  }
  let anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!anonKey || anonKey.trim() === '') {
    anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJhbm9uIn0.placeholder'
  }

  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component থেকে call হলে ignore করা হবে
          }
        },
      },
    }
  )
}
