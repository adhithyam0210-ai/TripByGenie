/**
 * Hero Banner CMS Data Access Repository
 */

const db = require('../config/database');
const localDb = require('../../db');

class BannerRepository {
  async findActiveOrdered() {
    if (db.isPostgres) {
      const res = await db.query(
        `SELECT b.*, p.title as cta_package_title, p.slug as cta_package_slug
         FROM hero_banners b
         LEFT JOIN packages p ON b.cta_package_id = p.id
         WHERE b.is_active = TRUE
         ORDER BY b.display_order ASC`
      );
      return res.rows;
    }
    const banners = localDb.findAll('banners', b => b.is_active !== false && b.status !== 'inactive');
    return banners.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  }

  async findAll() {
    if (db.isPostgres) {
      const res = await db.query(
        `SELECT b.*, p.title as cta_package_title
         FROM hero_banners b
         LEFT JOIN packages p ON b.cta_package_id = p.id
         ORDER BY b.display_order ASC`
      );
      return res.rows;
    }
    return localDb.findAll('banners');
  }

  async create(bannerData) {
    const { title, subtitle, media_url, cta_package_id, display_order, is_active } = bannerData;

    if (db.isPostgres) {
      const res = await db.query(
        `INSERT INTO hero_banners (title, subtitle, media_url, cta_package_id, display_order, is_active)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [title, subtitle || null, media_url, cta_package_id || null, display_order || 0, is_active !== false]
      );
      return res.rows[0];
    }

    const newBanner = {
      id: require('crypto').randomUUID(),
      title,
      subtitle,
      media_url,
      imageUrl: media_url,
      cta_package_id,
      display_order: display_order || 0,
      is_active: is_active !== false,
      status: is_active !== false ? 'active' : 'inactive',
      created_at: new Date().toISOString()
    };
    return localDb.insert('banners', newBanner);
  }

  async update(id, updates) {
    if (db.isPostgres) {
      const fields = [];
      const values = [];
      let idx = 1;
      for (const [key, val] of Object.entries(updates)) {
        fields.push(`${key} = $${idx}`);
        values.push(val);
        idx++;
      }
      values.push(id);
      const res = await db.query(
        `UPDATE hero_banners SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
        values
      );
      return res.rows[0];
    }
    return localDb.update('banners', id, updates);
  }

  async delete(id) {
    if (db.isPostgres) {
      await db.query('DELETE FROM hero_banners WHERE id = $1', [id]);
      return true;
    }
    return localDb.delete('banners', id);
  }
}

module.exports = new BannerRepository();
