/*
# La Kazarma - Initial Database Schema

Creates the complete schema for a private academic workspace with:
- Custom users table (server-side session auth, not Supabase Auth)
- Invitation codes for invite-only registration
- Subjects with topics
- Study materials with file uploads
- Assignments with student solutions
- Bookmarks for materials
- App settings

All access is through the server using the service role key (bypasses RLS).
RLS is enabled on all tables as a defense-in-depth measure, with policies
allowing anon+authenticated access since the server enforces authorization.
*/

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  avatar_url text,
  bio text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO anon, authenticated;

DROP POLICY IF EXISTS "users_all" ON users;
CREATE POLICY "users_all" ON users FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "users_ins" ON users FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "users_upd" ON users FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "users_del" ON users FOR DELETE TO anon, authenticated USING (true);

-- Invitation codes
CREATE TABLE IF NOT EXISTS invitation_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  used boolean DEFAULT false,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  used_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  used_at timestamptz
);

ALTER TABLE invitation_codes ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON invitation_codes TO anon, authenticated;

DROP POLICY IF EXISTS "inv_all" ON invitation_codes;
CREATE POLICY "inv_all" ON invitation_codes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "inv_ins" ON invitation_codes FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "inv_upd" ON invitation_codes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "inv_del" ON invitation_codes FOR DELETE TO anon, authenticated USING (true);

-- Subjects
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text,
  description text,
  semester text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON subjects TO anon, authenticated;

DROP POLICY IF EXISTS "subj_all" ON subjects;
CREATE POLICY "subj_all" ON subjects FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "subj_ins" ON subjects FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "subj_upd" ON subjects FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "subj_del" ON subjects FOR DELETE TO anon, authenticated USING (true);

-- Topics
CREATE TABLE IF NOT EXISTS topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON topics TO anon, authenticated;

DROP POLICY IF EXISTS "top_all" ON topics;
CREATE POLICY "top_all" ON topics FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "top_ins" ON topics FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "top_upd" ON topics FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "top_del" ON topics FOR DELETE TO anon, authenticated USING (true);

-- Materials
CREATE TABLE IF NOT EXISTS materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  topic_id uuid REFERENCES topics(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  file_type text,
  file_size bigint,
  uploaded_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON materials TO anon, authenticated;

DROP POLICY IF EXISTS "mat_all" ON materials;
CREATE POLICY "mat_all" ON materials FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "mat_ins" ON materials FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "mat_upd" ON materials FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "mat_del" ON materials FOR DELETE TO anon, authenticated USING (true);

-- Assignments
CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  due_date timestamptz,
  max_score int DEFAULT 100,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON assignments TO anon, authenticated;

DROP POLICY IF EXISTS "asg_all" ON assignments;
CREATE POLICY "asg_all" ON assignments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "asg_ins" ON assignments FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "asg_upd" ON assignments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "asg_del" ON assignments FOR DELETE TO anon, authenticated USING (true);

-- Solutions
CREATE TABLE IF NOT EXISTS solutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content text,
  file_url text,
  submitted_at timestamptz DEFAULT now(),
  score int,
  feedback text
);

ALTER TABLE solutions ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON solutions TO anon, authenticated;

DROP POLICY IF EXISTS "sol_all" ON solutions;
CREATE POLICY "sol_all" ON solutions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "sol_ins" ON solutions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "sol_upd" ON solutions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "sol_del" ON solutions FOR DELETE TO anon, authenticated USING (true);

-- Bookmarks
CREATE TABLE IF NOT EXISTS bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, material_id)
);

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON bookmarks TO anon, authenticated;

DROP POLICY IF EXISTS "bm_all" ON bookmarks;
CREATE POLICY "bm_all" ON bookmarks FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "bm_ins" ON bookmarks FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "bm_upd" ON bookmarks FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "bm_del" ON bookmarks FOR DELETE TO anon, authenticated USING (true);

-- Settings
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON settings TO anon, authenticated;

DROP POLICY IF EXISTS "set_all" ON settings;
CREATE POLICY "set_all" ON settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "set_ins" ON settings FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "set_upd" ON settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "set_del" ON settings FOR DELETE TO anon, authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_topics_subject_id ON topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_materials_subject_id ON materials(subject_id);
CREATE INDEX IF NOT EXISTS idx_materials_topic_id ON materials(topic_id);
CREATE INDEX IF NOT EXISTS idx_assignments_subject_id ON assignments(subject_id);
CREATE INDEX IF NOT EXISTS idx_solutions_assignment_id ON solutions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_solutions_user_id ON solutions(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
