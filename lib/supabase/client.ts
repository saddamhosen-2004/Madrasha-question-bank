import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url || url.trim() === '') {
    url = 'https://placeholder.supabase.co'
  }
  let anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!anonKey || anonKey.trim() === '') {
    anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJhbm9uIn0.placeholder'
  }
  return createBrowserClient(url, anonKey)
}
