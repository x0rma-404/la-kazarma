const supabase = require('../config/database');

const Material = {
  async create({ subject_id, topic_id, title, description, file_url, file_type, file_size, uploaded_by, category, tags }) {
    const { data, error } = await supabase
      .from('materials')
      .insert({ subject_id, topic_id: topic_id || null, title, description, file_url, file_type, file_size, uploaded_by, category, tags })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async findAll() {
    const { data, error } = await supabase
      .from('materials')
      .select('*, subject:subjects(id,name,code), topic:topics(id,name), uploader:users!materials_uploaded_by_fkey(name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async findBySubject(subjectId) {
    const { data, error } = await supabase
      .from('materials')
      .select('*, subject:subjects(id,name,code), topic:topics(id,name), uploader:users!materials_uploaded_by_fkey(name)')
      .eq('subject_id', subjectId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async findByUploader(userId) {
    const { data, error } = await supabase
      .from('materials')
      .select('*, subject:subjects(id,name,code)')
      .eq('uploaded_by', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async findById(id) {
    const { data, error } = await supabase
      .from('materials')
      .select('*, subject:subjects(*), topic:topics(*), uploader:users!materials_uploaded_by_fkey(name)')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase.from('materials').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  async count() {
    const { count, error } = await supabase
      .from('materials')
      .select('*', { count: 'exact', head: true });
    if (error) throw error;
    return count || 0;
  },

  async findRecent(limit = 5) {
    const { data, error } = await supabase
      .from('materials')
      .select('*, subject:subjects(id,name,code)')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },
};

module.exports = Material;
