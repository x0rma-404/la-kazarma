const supabase = require('../config/database');

const Setting = {
  async get(key, defaultValue = null) {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', key)
      .maybeSingle();
    if (error) throw error;
    return data ? data.value : defaultValue;
  },

  async set(key, value) {
    const { data, error } = await supabase
      .from('settings')
      .upsert({ key, value, updated_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getAll() {
    const { data, error } = await supabase
      .from('settings')
      .select('key, value')
      .order('key', { ascending: true });
    if (error) throw error;
    const result = {};
    (data || []).forEach((s) => { result[s.key] = s.value; });
    return result;
  },
};

module.exports = Setting;
