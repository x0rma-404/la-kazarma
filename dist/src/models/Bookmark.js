const supabase = require('../config/database');

const Bookmark = {
  async create({ user_id, material_id }) {
    const { data, error } = await supabase
      .from('bookmarks')
      .insert({ user_id, material_id })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async findByUser(userId) {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*, material:materials(*, subject:subjects(id,name,code))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async delete(id) {
    const { error } = await supabase.from('bookmarks').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  async deleteByUserAndMaterial(userId, materialId) {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('material_id', materialId);
    if (error) throw error;
    return true;
  },

  async isBookmarked(userId, materialId) {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', userId)
      .eq('material_id', materialId)
      .maybeSingle();
    if (error) throw error;
    return !!data;
  },

  async getBookmarkedIds(userId) {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('material_id')
      .eq('user_id', userId);
    if (error) throw error;
    return (data || []).map((b) => b.material_id);
  },
};

module.exports = Bookmark;
