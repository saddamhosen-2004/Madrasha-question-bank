import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/setup-admin
// Step 1: Signs up the admin user
// Step 2: Calls make_admin() RPC to promote to admin
// Body: { email, password, secret_key }

export async function POST(request: NextRequest) {
  try {
    const { email, password, secret_key } = await request.json()

    if (secret_key !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: 'Unauthorized — secret key মিলছে না' }, { status: 401 })
    }

    if (!email || !password) {
      return NextResponse.json({ error: 'Email ও password দিতে হবে' }, { status: 400 })
    }

    const supabase = await createClient()

    // Step 1: Sign up to create auth user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: undefined },
    })

    if (signUpError) {
      // If already exists, still try to promote
      if (!signUpError.message.includes('already registered')) {
        return NextResponse.json({ error: signUpError.message }, { status: 400 })
      }
    }

    // Step 2: Call make_admin RPC (SECURITY DEFINER bypasses RLS)
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('make_admin', {
        p_email: email,
        p_secret: secret_key,
      })

    if (rpcError) {
      return NextResponse.json({ error: rpcError.message }, { status: 400 })
    }

    const result = rpcResult as { error?: string; success?: boolean; user_id?: string }

    if (result?.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Admin user সফলভাবে তৈরি হয়েছে! এখন /admin/login এ লগইন করুন।',
      email,
    })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
