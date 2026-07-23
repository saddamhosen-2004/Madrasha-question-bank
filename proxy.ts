import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  let url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url || url.trim() === '') {
    url = 'https://placeholder.supabase.co'
  }
  let anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!anonKey || anonKey.trim() === '') {
    anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJhbm9uIn0.placeholder'
  }

  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // Helper to ensure session cookies are preserved during redirects
  function redirectWithCookies(targetPath: string) {
    const redirectResponse = NextResponse.redirect(new URL(targetPath, request.url))
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value)
    })
    return redirectResponse
  }

  // ---- Admin routes ----
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!user) {
      return redirectWithCookies('/admin/login')
    }
    // Check if admin
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (!adminUser) {
      return redirectWithCookies('/admin/login')
    }
  }

  // ---- Institution dashboard routes ----
  if (pathname.startsWith('/dashboard')) {
    if (!user) {
      return redirectWithCookies('/auth/login')
    }

    // Check institution exists and is approved
    const { data: institution } = await supabase
      .from('institutions')
      .select('id, is_approved, subscription_status, subscription_expiry, trial_start_date')
      .eq('auth_user_id', user.id)
      .single()

    if (!institution) {
      // Check if logged-in user is admin to avoid redirect loop
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      if (adminUser) {
        return redirectWithCookies('/admin')
      }

      return redirectWithCookies('/auth/login')
    }

    if (!institution.is_approved) {
      return redirectWithCookies('/auth/pending')
    }

    // Subscription gate — only for create/generate routes
    const isCreateRoute = pathname.startsWith('/dashboard/create') || 
                          pathname.startsWith('/dashboard/auto-generate')

    if (isCreateRoute) {
      const now = new Date()

      if (institution.subscription_status === 'blocked') {
        return redirectWithCookies('/dashboard/subscription?reason=blocked')
      }

      if (institution.subscription_status === 'trial') {
        const trialStart = new Date(institution.trial_start_date!)
        const trialEnd = new Date(trialStart)
        trialEnd.setDate(trialEnd.getDate() + 7)
        if (now > trialEnd) {
          return redirectWithCookies('/dashboard/subscription?reason=trial_expired')
        }
      }

      if (institution.subscription_status === 'expired') {
        return redirectWithCookies('/dashboard/subscription?reason=expired')
      }

      if (institution.subscription_status === 'active' && institution.subscription_expiry) {
        if (now > new Date(institution.subscription_expiry)) {
          return redirectWithCookies('/dashboard/subscription?reason=expired')
        }
      }
    }
  }

  // ---- Redirect logged-in users away from auth pages ----
  if (user && (pathname === '/auth/login' || pathname === '/auth/register' || pathname === '/admin/login')) {
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (adminUser) {
      return redirectWithCookies('/admin')
    }
    return redirectWithCookies('/dashboard')
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder assets (images, fonts, etc)
     * - API routes that don't need auth
     */
    '/((?!_next/static|_next/image|favicon\.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot|css|js)$).*)',
  ],
}
