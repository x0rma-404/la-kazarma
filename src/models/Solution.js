'use strict';

const db = require('../config/database');

const Solution = {
  findByAssignmentId(assignmentId) {
    return db.prepare(`
      SELECT sol.*,
             u.full_name AS student_name,
             u.username AS student_username,
             u.student_code AS student_code
      FROM solutions sol
      JOIN users u ON sol.student_id = u.id
      WHERE sol.assignment_id = ?
      ORDER BY sol.created_at DESC
    `).all(assignmentId);
  },

  findById(id) {
    return db.prepare(`
      SELECT sol.*,
             u.full_name AS student_name,
             u.username AS student_username,
             u.student_code AS student_code,
             a.title AS assignment_title,
             a.id AS assignment_id
      FROM solutions sol
      JOIN users u ON sol.student_id = u.id
      JOIN assignments a ON sol.assignment_id = a.id
      WHERE sol.id = ?
    `).get(id);
  },

  findByStudentAndAssignment(studentId, assignmentId) {
    return db.prepare(`
      SELECT * FROM solutions
      WHERE student_id = ? AND assignment_id = ?
    `).all(studentId, assignmentId);
  },

  create(data) {
    const stmt = db.prepare(`
      INSERT INTO solutions (
        assignment_id, student_id, title, notes,
        file_path, file_name, original_name, file_type, file_size
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const res = stmt.run(
      data.assignment_id,
      data.student_id,
      data.title.trim(),
      (data.notes || '').trim(),
      data.file_path,
      data.file_name,
      data.original_name,
      data.file_type.toLowerCase(),
      data.file_size
    );
    return this.findById(Number(res.lastInsertRowid));
  },

  delete(id) {
    return db.prepare('DELETE FROM solutions WHERE id = ?').run(id);
  },

  countAll() {
    return db.prepare('SELECT COUNT(*) as n FROM solutions').get().n;
  },

  countByStudent(studentId) {
    return db.prepare('SELECT COUNT(*) as n FROM solutions WHERE student_id = ?').get(studentId).n;
  }
};

module.exports = Solution;

