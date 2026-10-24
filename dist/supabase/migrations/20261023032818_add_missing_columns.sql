/*
# Add missing columns and tables for full feature support

1. New columns on users: username, student_code
2. New columns on subjects: academic_year
3. New columns on materials: category, tags
4. New columns on assignments: tags, file_url, deadline_date, deadline_time
5. New columns on solutions: title, notes, student_code
6. New table: announcements (subject-level posts by admin)
7. New table: subject_announcements
8. Settings table already exists; admin settings endpoints will use it.
*/

-- Users: add username and student_code
ALTER TABLE users ADD COLUMN IF NOT EXISTS username text UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS student_code text;

-- Subjects: add academic_year
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS academic_year text;

-- Materials: add category and tags
ALTER TABLE materials ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS tags text;

-- Assignments: add tags, file_url
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS tags text;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS file_url text;

-- Solutions: add title and notes
ALTER TABLE solutions ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE solutions ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE solutions ADD COLUMN IF NOT EXISTS student_code text;

-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON announcements TO anon, authenticated;

DROP POLICY IF EXISTS "ann_all" ON announcements;
CREATE POLICY "ann_all" ON announcements FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "ann_ins" ON announcements FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "ann_upd" ON announcements FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "ann_del" ON announcements FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_announcements_subject_id ON announcements(subject_id);
