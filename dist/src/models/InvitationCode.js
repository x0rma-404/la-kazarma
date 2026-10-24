const supabase = require('../config/database');
const crypto = require('crypto');

const InvitationCode = {
  async create(createdBy) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    const { data, error } = await supabase
      .from('invitation_codes')
      .insert({ code, created_by: createdBy })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async findByCode(code) {
    const { data, error } = await supabase
      .from('invitation_codes')
      .select('*')
      .eq('code', code)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async markUsed(code, userId) {
    const { data, error } = await supabase
      .from('invitation_codes')
      .update({ used: true, used_by: userId, used_at: new Date().toISOString() })
      .eq('code', code)
      .eq('used', false)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async findAll() {
    const { data, error } = await supabase
      .from('invitation_codes')
      .select('*, created_by_user:users!invitation_codes_created_by_fkey(name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async delete(id) {
    const { error } = await supabase.from('invitation_codes').delete().eq('id', id);
    if (error) throw error;
    return true;
  },
};

module.exports = InvitationCode;
