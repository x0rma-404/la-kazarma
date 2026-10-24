const supabase = require('../config/database');
const bcrypt = require('bcryptjs');

const User = {
  async create({ name, email, password, role = 'student', username, student_code }) {
    const passwordHash = await bcrypt.hash(password, 10);
    const { data, error } = await supabase
      .from('users')
      .insert({ name, email, password_hash: passwordHash, role, username, student_code })
      .select('id, name, email, role, username, student_code, avatar_url, bio, created_at')
      .single();
    if (error) throw error;
    return data;
  },

  async findByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async findByUsername(username) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async findByIdentifier(identifier) {
    // Try username first, then email
    let user = await this.findByUsername(identifier);
    if (!user) user = await this.findByEmail(identifier);
    return user;
  },

  async findById(id) {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, username, student_code, avatar_url, bio, created_at')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async verifyPassword(plainPassword, hash) {
    return bcrypt.compare(plainPassword, hash);
  },

  async update(id, updates) {
    const allowed = {};
    if (updates.name !== undefined) allowed.name = updates.name;
    if (updates.avatar_url !== undefined) allowed.avatar_url = updates.avatar_url;
    if (updates.bio !== undefined) allowed.bio = updates.bio;
    if (updates.role !== undefined) allowed.role = updates.role;
    allowed.updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from('users')
      .update(allowed)
      .eq('id', id)
      .select('id, name, email, role, username, student_code, avatar_url, bio, created_at')
      .single();
    if (error) throw error;
    return data;
  },

  async updatePassword(id, newPassword) {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const { error } = await supabase
      .from('users')
      .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  async findAll() {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, username, student_code, avatar_url, bio, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async count() {
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    if (error) throw error;
    return count || 0;
  },
};

module.exports = User;
