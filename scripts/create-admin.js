/**
 * create-admin.js — Admin user তৈরির standalone script
 * Run: node scripts/create-admin.js
 */

const SUPABASE_URL = 'https://wydfrrxwsefkeqkazuqu.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZGZycnh3c2Vma2Vxa2F6dXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3MzgyOTUsImV4cCI6MjEwMDMxNDI5NX0.R-aPlA7GhWdoGO_SdPDC-lyGSiLGS-i6bOnwkYLVHf0'
const SECRET_KEY = 'madrasha_admin_2026_super_secret'

// ─── আপনার admin email এবং password এখানে দিন ───
const ADMIN_EMAIL = 'hello.saddamhosen@gmail.com'
const ADMIN_PASSWORD = 'Admin@2026#Madrasha'
// ──────────────────────────────────────────────────

async function createAdmin() {
  console.log('🚀 Admin user তৈরি করা হচ্ছে...\n')

  // Step 1: Sign up
  console.log(`📧 Email: ${ADMIN_EMAIL}`)
  console.log('🔐 Step 1: Auth user তৈরি করা হচ্ছে...')

  const signUpRes = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    }),
  })

  const signUpData = await signUpRes.json()

  if (signUpData.error && !signUpData.error.message?.includes('already registered')) {
    console.error('❌ SignUp error:', signUpData.error.message)
    process.exit(1)
  }

  if (signUpData.error?.message?.includes('already registered')) {
    console.log('ℹ️  User already exists, trying to promote to admin...')
  } else {
    console.log('✅ Auth user তৈরি হয়েছে!')
  }

  // Small wait
  await new Promise(r => setTimeout(r, 1000))

  // Step 2: Sign in to get JWT token
  console.log('🔑 Step 2: Login করা হচ্ছে...')
  const signInRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    }),
  })

  const signInData = await signInRes.json()

  if (signInData.error) {
    console.error('❌ Login error:', signInData.error.message || signInData.error)
    process.exit(1)
  }

  const accessToken = signInData.access_token
  console.log('✅ Login সফল!')

  // Step 3: Call make_admin RPC
  console.log('👑 Step 3: Admin হিসেবে নিযুক্ত করা হচ্ছে...')
  const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/make_admin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      p_email: ADMIN_EMAIL,
      p_secret: SECRET_KEY,
    }),
  })

  const rpcData = await rpcRes.json()

  if (rpcData.error) {
    console.error('❌ RPC error:', rpcData.error)
    process.exit(1)
  }

  if (rpcData && typeof rpcData === 'object' && rpcData.error) {
    console.error('❌ make_admin error:', rpcData.error)
    process.exit(1)
  }

  console.log('\n' + '═'.repeat(50))
  console.log('🎉 ADMIN USER সফলভাবে তৈরি হয়েছে!')
  console.log('═'.repeat(50))
  console.log(`📧 Email:    ${ADMIN_EMAIL}`)
  console.log(`🔑 Password: ${ADMIN_PASSWORD}`)
  console.log(`🌐 Login:    http://localhost:3000/admin/login`)
  console.log('═'.repeat(50))
}

createAdmin().catch(err => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
