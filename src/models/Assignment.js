const supabase = require('../config/database');

const Assignment = {
  async create({ subject_id, title, description, due_date, max_score = 100, created_by, tags, file_url }) {
    const { data, error } = await supabase
      .from('assignments')
      .insert({ subject_id, title, description, due_date, max_score, created_by, tags, file_url })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async findAll() {
    const { data, error } = await supabase
      .from('assignments')
      .select('*, subject:subjects(id,name,code)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async findBySubject(subjectId) {
    const { data, error } = await supabase
      .from('assignments')
      .select('*, subject:subjects(id,name,code)')
      .eq('subject_id', subjectId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async findById(id) {
    const { data, error } = await supabase
      .from('assignments')
      .select('*, subject:subjects(*)')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async findByIdWithSolutions(id) {
    const { data, error } = await supabase
      .from('assignments')
      .select('*, subject:subjects(*), solutions:solutions(*, user:users!solutions_user_id_fkey(id,name,username,student_code))')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase.from('assignments').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  async count() {
    const { count, error } = await supabase
      .from('assignments')
      .select('*', { count: 'exact', head: true });
    if (error) throw error;
    return count || 0;
  },

  async findUpcoming(limit = 5) {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('assignments')
      .select('*, subject:subjects(id,name,code)')
      .gte('due_date', now)
      .order('due_date', { ascending: true })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },
};

module.exports = Assignment;
