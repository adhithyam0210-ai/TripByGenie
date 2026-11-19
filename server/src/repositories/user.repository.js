/**
 * User Data Access Repository
 * Executes 3NF parameterized queries for unified user identities
 */

const db = require('../config/database');
const localDb = require('../../db');

class UserRepository {
  async findByEmail(email) {
    if (db.isPostgres) {
      const res = await db.query(
        'SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1',
        [email]
      );
      return res.rows[0] || null;
    }
    return localDb.findOne('users', u => u.email && u.email.toLowerCase() === email.toLowerCase());
  }

  async findById(id) {
    if (db.isPostgres) {
      const res = await db.query(
        'SELECT id, user_code, full_name, email, phone, role, is_active, created_at, updated_at FROM users WHERE id = $1 LIMIT 1',
        [id]
      );
      return res.rows[0] || null;
    }
    const user = localDb.findById('users', id);
    if (!user) return null;
    return {
      id: user.id,
      user_code: user.user_code || user.staff_id || user.agent_code || 'USR-000',
      full_name: user.name || user.full_name,
      email: user.email,
      phone: user.phone,
      role: (user.role || 'CUSTOMER').toUpperCase(),
      is_active: user.status === 'active' || user.is_active !== false,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
  }

  async findByUserCode(userCode) {
    if (db.isPostgres) {
      const res = await db.query(
        'SELECT * FROM users WHERE user_code = $1 LIMIT 1',
        [userCode]
      );
      return res.rows[0] || null;
    }
    return localDb.findOne('users', u => u.user_code === userCode || u.staff_id === userCode || u.agent_code === userCode);
  }

  async create(userData, client = null) {
    const { id, user_code, full_name, email, phone, password_hash, role, created_by } = userData;

    if (db.isPostgres && client) {
      const res = await client.query(
        `INSERT INTO users (id, user_code, full_name, email, phone, password_hash, role, created_by)
         VALUES (COALESCE($1, gen_random_uuid()), $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, user_code, full_name, email, phone, role, is_active, created_at`,
        [id || null, user_code, full_name, email, phone || null, password_hash, role, created_by || null]
      );
      return res.rows[0];
    } else if (db.isPostgres) {
      const res = await db.query(
        `INSERT INTO users (id, user_code, full_name, email, phone, password_hash, role, created_by)
         VALUES (COALESCE($1, gen_random_uuid()), $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, user_code, full_name, email, phone, role, is_active, created_at`,
        [id || null, user_code, full_name, email, phone || null, password_hash, role, created_by || null]
      );
      return res.rows[0];
    }

    // Local DB fallback
    const newUser = {
      id: id || require('crypto').randomUUID(),
      user_code,
      name: full_name,
      full_name,
      email,
      phone,
      password: password_hash,
      password_hash,
      role: role.toUpperCase(),
      status: 'active',
      is_active: true,
      created_by,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    return localDb.insert('users', newUser);
  }

  async findAllByRole(role) {
    if (db.isPostgres) {
      const res = await db.query(
        'SELECT id, user_code, full_name, email, phone, role, is_active, created_at FROM users WHERE role = $1 ORDER BY created_at DESC',
        [role]
      );
      return res.rows;
    }
    return localDb.findAll('users', u => (u.role || '').toUpperCase() === role.toUpperCase());
  }
}

module.exports = new UserRepository();
