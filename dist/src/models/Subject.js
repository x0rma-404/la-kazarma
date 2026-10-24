const supabase = require('../config/database');

const Subject = {
  async create({ name, code, description, semester, academic_year }) {
    const { data, error } = await supabase
      .from('subjects')
      .insert({ name, code, description, semester, academic_year })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async findAll() {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async findById(id) {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async findByIdWithDetails(id) {
    const { data: subject, error: sErr } = await supabase
      .from('subjects')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (sErr) throw sErr;
    if (!subject) return null;
    const { data: topics } = await supabase
      .from('topics')
      .select('*')
      .eq('subject_id', id)
      .order('sort_order', { ascending: true });
    subject.topics = topics || [];
    const { data: announcements } = await supabase
      .from('announcements')
      .select('*, created_by_user:users!announcements_created_by_fkey(name)')
      .eq('subject_id', id)
      .order('created_at', { ascending: false });
    subject.announcements = announcements || [];
    return subject;
  },

  async update(id, updates) {
    const allowed = {};
    if (updates.name !== undefined) allowed.name = updates.name;
    if (updates.code !== undefined) allowed.code = updates.code;
    if (updates.description !== undefined) allowed.description = updates.description;
    if (updates.semester !== undefined) allowed.semester = updates.semester;
    if (updates.academic_year !== undefined) allowed.academic_year = updates.academic_year;
    const { data, error } = await supabase
      .from('subjects')
      .update(allowed)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase.from('subjects').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  async count() {
    const { count, error } = await supabase
      .from('subjects')
      .select('*', { count: 'exact', head: true });
    if (error) throw error;
    return count || 0;
  },
};

module.exports = Subject;
