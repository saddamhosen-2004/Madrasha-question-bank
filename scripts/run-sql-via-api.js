/**
 * run-sql-via-api.js
 * Supabase Management API দিয়ে directly SQL run করে
 * 
 * Usage: node scripts/run-sql-via-api.js YOUR_ACCESS_TOKEN
 * 
 * Access Token পেতে:
 * 1. https://supabase.com/dashboard/account/tokens
 * 2. "Generate new token" → নাম দিন → Copy করুন
 */

const PROJECT_REF = 'psxwbudwjogshkuyndhf'
const ACCESS_TOKEN = process.argv[2]

if (!ACCESS_TOKEN) {
  console.log('\n❌ Access token দেননি!')
  console.log('\n📋 Token পেতে:')
  console.log('   1. https://supabase.com/dashboard/account/tokens')
  console.log('   2. "Generate new token" → নাম দিন → Copy করুন')
  console.log('\n▶️  তারপর run করুন:')
  console.log('   node scripts/run-sql-via-api.js YOUR_TOKEN_HERE\n')
  process.exit(1)
}

const SQL = `
-- is_admin helper function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM admin_users WHERE auth_user_id = auth.uid()) $$;

GRANT EXECUTE ON FUNCTION is_admin() TO authenticated, anon;

-- Admin CRUD policies
DO $$ BEGIN
  CREATE POLICY "admin_all_jamats" ON jamats FOR ALL USING (is_admin()) WITH CHECK (is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "admin_all_kitabs" ON kitabs FOR ALL USING (is_admin()) WITH CHECK (is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "admin_all_chapters" ON chapters FOR ALL USING (is_admin()) WITH CHECK (is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "admin_all_questions" ON questions FOR ALL USING (is_admin()) WITH CHECK (is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "admin_all_institutions" ON institutions FOR ALL USING (is_admin()) WITH CHECK (is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "admin_all_payments" ON mq_payments FOR ALL USING (is_admin()) WITH CHECK (is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "admin_all_papers" ON generated_papers FOR ALL USING (is_admin()) WITH CHECK (is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

SELECT 'Admin RLS OK' AS status;
`

async function runSQL() {
  console.log('🚀 Supabase Management API দিয়ে SQL run করা হচ্ছে...\n')

  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ query: SQL }),
  })

  const data = await res.json()

  if (!res.ok) {
    console.error('❌ Error:', JSON.stringify(data, null, 2))
    process.exit(1)
  }

  console.log('✅ SQL সফলভাবে run হয়েছে!')
  console.log('📊 Result:', JSON.stringify(data, null, 2))
  console.log('\n🎉 Admin CRUD এখন fully functional!')
  console.log('👑 Admin login: http://localhost:3000/admin/login')
}

runSQL().catch(err => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
