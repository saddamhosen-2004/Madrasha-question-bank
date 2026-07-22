/**
 * setup-rls.js — Admin RLS Policies setup script
 * Run: node scripts/setup-rls.js
 * 
 * This script adds proper RLS policies so admin can do CRUD on all tables.
 * It uses the Supabase anon key with a SECURITY DEFINER approach.
 */

const SUPABASE_URL = 'https://psxwbudwjogshkuyndhf.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzeHdidWR3am9nc2hrdXluZGhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3MzU2NDYsImV4cCI6MjEwMDMxMTY0Nn0.9ERrQ254MAOdWWoZnPfqKuGAnknhSsjnQZlPFWsIpuk'
const ADMIN_EMAIL = 'hello.saddamhosen@gmail.com'
const ADMIN_PASSWORD = 'Admin@2026#Madrasha'

async function setupRLS() {
  console.log('🔐 Admin login করা হচ্ছে...')

  // Login as admin
  const signInRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  })
  const signInData = await signInRes.json()
  if (signInData.error) {
    console.error('❌ Login failed:', signInData.error)
    process.exit(1)
  }
  const token = signInData.access_token
  console.log('✅ Login সফল!\n')

  // Call setup_admin_policies RPC
  console.log('⚙️  RLS policies setup করা হচ্ছে...')
  const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/setup_admin_policies`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ p_secret: 'madrasha_admin_2026_super_secret' }),
  })

  const rpcText = await rpcRes.text()
  console.log('RPC Response:', rpcText)

  if (rpcRes.ok) {
    console.log('\n✅ RLS policies setup সম্পন্ন!')
    console.log('🎉 Admin panel এখন fully functional!')
  } else {
    console.log('\n⚠️  RPC call failed. Supabase dashboard এ manually SQL run করুন।')
    console.log('📄 SQL file: supabase-setup.sql\n')
    console.log('Steps:')
    console.log('1. https://supabase.com/dashboard/project/psxwbudwjogshkuyndhf')
    console.log('2. SQL Editor → New Query')
    console.log('3. supabase-setup.sql এর সব content paste করুন')
    console.log('4. Run করুন')
  }
}

setupRLS().catch(console.error)
