const supabase = require('../config/database');

const Subject = {
  async create({ name, code, description, semester }) {
    const { data, error } = await supabase
      .from('subjects')
      .insert({ name, code, description, semester })
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
    const { data, error } = await supabase
      .from('subjects')
      .select('*, topics:topics(*)')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (data && data.topics) {
      data.topics.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    }
    return data;
  },

  async update(id, updates) {
    const allowed = {};
    if (updates.name !== undefined) allowed.name = updates.name;
    if (updates.code !== undefined) allowed.code = updates.code;
    if (updates.description !== undefined) allowed.description = updates.description;
    if (updates.semester !== undefined) allowed.semester = updates.semester;
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
