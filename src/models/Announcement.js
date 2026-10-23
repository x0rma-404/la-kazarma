const supabase = require('../config/database');

const Announcement = {
  async create({ subject_id, title, content, created_by }) {
    const { data, error } = await supabase
      .from('announcements')
      .insert({ subject_id, title, content, created_by })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async findBySubject(subjectId) {
    const { data, error } = await supabase
      .from('announcements')
      .select('*, created_by_user:users!announcements_created_by_fkey(name)')
      .eq('subject_id', subjectId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async delete(id) {
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) throw error;
    return true;
  },
};

module.exports = Announcement;
