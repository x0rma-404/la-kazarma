const supabase = require('../config/database');

const Topic = {
  async create({ subject_id, name, description, sort_order = 0 }) {
    const { data, error } = await supabase
      .from('topics')
      .insert({ subject_id, name, description, sort_order })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async findBySubject(subjectId) {
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .eq('subject_id', subjectId)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async findById(id) {
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase.from('topics').delete().eq('id', id);
    if (error) throw error;
    return true;
  },
};

module.exports = Topic;
