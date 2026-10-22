const supabase = require('../config/database');

const Solution = {
  async create({ assignment_id, user_id, content, file_url }) {
    const { data, error } = await supabase
      .from('solutions')
      .insert({ assignment_id, user_id, content, file_url })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async findByAssignment(assignmentId) {
    const { data, error } = await supabase
      .from('solutions')
      .select('*, user:users!solutions_user_id_fkey(id,name)')
      .eq('assignment_id', assignmentId)
      .order('submitted_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async findByUser(userId) {
    const { data, error } = await supabase
      .from('solutions')
      .select('*, assignment:assignments(id,title,subject:subjects(id,name))')
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async findByAssignmentAndUser(assignmentId, userId) {
    const { data, error } = await supabase
      .from('solutions')
      .select('*')
      .eq('assignment_id', assignmentId)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async grade(id, score, feedback) {
    const { data, error } = await supabase
      .from('solutions')
      .update({ score, feedback })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

module.exports = Solution;
