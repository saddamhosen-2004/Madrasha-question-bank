/**
 * test-registration.js
 * Test the registration process and creation of institution
 */

const SUPABASE_URL = 'https://wydfrrxwsefkeqkazuqu.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZGZycnh3c2Vma2Vxa2F6dXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3MzgyOTUsImV4cCI6MjEwMDMxNDI5NX0.R-aPlA7GhWdoGO_SdPDC-lyGSiLGS-i6bOnwkYLVHf0'

const TEST_EMAIL = 'madrasha_test_' + Math.floor(Math.random() * 100000) + '@test.com'
const TEST_PASSWORD = 'TestPassword123'

async function runTest() {
  console.log('Testing register_institution_direct with email:', TEST_EMAIL)
  
  // Call RPC directly to create auth user & institution
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/register_institution_direct`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY
    },
    body: JSON.stringify({
      p_email: TEST_EMAIL,
      p_password: TEST_PASSWORD,
      p_name: 'টেস্ট মাদ্রাসা',
      p_phone: '01700000000',
      p_address: 'ঢাকা, বাংলাদেশ',
      p_logo_url: null
    })
  })
  
  const data = await res.json()
  console.log('RPC response:', data)

  if (data.error || (data && data.error)) {
    console.error('Registration failed:', data.error || data)
    process.exit(1)
  }

  // Verify login works with these new credentials!
  console.log('Testing login with the new credentials...')
  const loginRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY
    },
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    })
  })
  
  const loginData = await loginRes.json()
  console.log('Login Response:', loginData)
  if (loginData.error) {
    console.error('❌ LOGIN TEST FAILED:', loginData.error)
    process.exit(1)
  } else {
    console.log('✅ LOGIN TEST SUCCESSFUL! Access token:', !!loginData.access_token)
  }
  
  // Verify in DB
  const res3 = await fetch(`${SUPABASE_URL}/rest/v1/institutions?email=eq.${TEST_EMAIL}`, {
    method: 'GET',
    headers: {
      'apikey': SUPABASE_ANON_KEY
    }
  })
  
  const data3 = await res3.json()
  console.log('Institutions table contents:', data3)
  if (data3 && data3.length > 0) {
    console.log('🎉 REGISTRATION FLOW WORKS PERFECTLY!')
  } else {
    console.error('❌ Institution record not created.')
  }
}

runTest().catch(console.error)
