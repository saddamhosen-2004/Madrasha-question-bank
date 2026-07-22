-- ================================================================
-- MADRASHA QUESTION BANK - COMPLETE SETUP SQL
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- Project: psxwbudwjogshkuyndhf
-- ================================================================

-- ── STEP 1: Helper function to check if current user is admin ──
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users WHERE auth_user_id = auth.uid()
  )
$$;

GRANT EXECUTE ON FUNCTION is_admin() TO authenticated, anon;

-- ── STEP 2: Admin CRUD policies for content tables ──

-- Jamats
CREATE POLICY "admin_all_jamats" ON jamats
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Kitabs
CREATE POLICY "admin_all_kitabs" ON kitabs
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Chapters
CREATE POLICY "admin_all_chapters" ON chapters
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Questions
CREATE POLICY "admin_all_questions" ON questions
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Institutions (admin can approve/block/update)
CREATE POLICY "admin_all_institutions" ON institutions
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Payments (admin can verify)
CREATE POLICY "admin_all_payments" ON mq_payments
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Subscriptions (admin can manage)
CREATE POLICY "admin_all_subs" ON mq_subscriptions
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Generated Papers (admin can view all)
CREATE POLICY "admin_all_papers" ON generated_papers
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Admin Users (admin can manage)
CREATE POLICY "admin_all_admin_users" ON admin_users
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ── STEP 3: Allow any authenticated user to self-register as institution ──
-- (needed so new signups can insert their own institution row)
DROP POLICY IF EXISTS "inst_insert_own" ON institutions;
CREATE POLICY "inst_insert_own" ON institutions
  FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

-- ── STEP 4: Storage policies for logo upload ──
-- (Already created, but if missing run these)
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'institution-logos', 'institution-logos', true, 2097152,
    ARRAY['image/jpeg','image/png','image/webp','image/gif']
  ) ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ── STEP 5: make_admin RPC (in case it was not created) ──
CREATE OR REPLACE FUNCTION make_admin(p_email TEXT, p_secret TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  IF p_secret != 'madrasha_admin_2026_super_secret' THEN
    RETURN json_build_object('error', 'Unauthorized');
  END IF;

  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN json_build_object('error', 'User not found');
  END IF;

  INSERT INTO admin_users (email, auth_user_id)
  VALUES (p_email, v_user_id)
  ON CONFLICT (email) DO UPDATE SET auth_user_id = v_user_id;

  RETURN json_build_object('success', true, 'email', p_email);
END;
$$;

GRANT EXECUTE ON FUNCTION make_admin(TEXT, TEXT) TO anon, authenticated;

SELECT 'Setup complete!' AS status;
