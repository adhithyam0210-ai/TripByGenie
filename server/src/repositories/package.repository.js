/**
 * Package Data Access Repository
 * Enforces dual-pricing isolation:
 * - Public & Customer queries NEVER retrieve or expose b2b_offer_price
 * - Agent queries expose wholesale rates and potential margin
 * - Admin queries expose complete pricing and management controls
 */

const db = require('../config/database');
const localDb = require('../../db');

class PackageRepository {
  /**
   * Public B2C catalog - STRICTLY omits b2b_offer_price
   */
  async findAllActivePublic() {
    if (db.isPostgres) {
      const res = await db.query(
        `SELECT id, slug, title, destination, duration_days, duration_nights,
                b2c_price, itinerary_details, inclusions, exclusions, cover_image, is_active, created_at
         FROM packages
         WHERE is_active = TRUE
         ORDER BY title ASC`
      );
      return res.rows;
    }

    const packages = localDb.findAll('packages', p => p.is_active !== false && p.status !== 'inactive');
    return packages.map(p => ({
      id: p.id,
      slug: p.slug || p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title: p.title || p.name,
      destination: p.destination,
      duration_days: p.duration_days || p.days || 3,
      duration_nights: p.duration_nights || p.nights || 2,
      b2c_price: Number(p.b2c_price || p.price || 0),
      // CRITICAL: b2b_offer_price is intentionally omitted
      itinerary_details: p.itinerary_details || p.itinerary || [],
      inclusions: p.inclusions || [],
      exclusions: p.exclusions || [],
      cover_image: p.cover_image || p.image || p.imageUrl,
      is_active: true,
      created_at: p.created_at
    }));
  }

  /**
   * B2B Agent Wholesale Catalog - Exposes wholesale offer price alongside MSRP
   */
  async findAllForAgent() {
    if (db.isPostgres) {
      const res = await db.query(
        `SELECT id, slug, title, destination, duration_days, duration_nights,
                b2c_price, b2b_offer_price,
                (b2c_price - b2b_offer_price) AS potential_markup_savings,
                itinerary_details, inclusions, exclusions, cover_image, is_active
         FROM packages
         WHERE is_active = TRUE
         ORDER BY title ASC`
      );
      return res.rows;
    }

    const packages = localDb.findAll('packages', p => p.is_active !== false && p.status !== 'inactive');
    return packages.map(p => {
      const b2c = Number(p.b2c_price || p.price || 0);
      const b2b = Number(p.b2b_offer_price || p.b2b_price || (b2c * 0.8));
      return {
        id: p.id,
        slug: p.slug || p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        title: p.title || p.name,
        destination: p.destination,
        duration_days: p.duration_days || p.days || 3,
        duration_nights: p.duration_nights || p.nights || 2,
        b2c_price: b2c,
        b2b_offer_price: b2b,
        potential_markup_savings: Math.max(0, b2c - b2b),
        itinerary_details: p.itinerary_details || p.itinerary || [],
        inclusions: p.inclusions || [],
        exclusions: p.exclusions || [],
        cover_image: p.cover_image || p.image || p.imageUrl,
        is_active: true
      };
    });
  }

  /**
   * Admin CMS view - Complete access to all pricing and package metadata
   */
  async findAllForAdmin() {
    if (db.isPostgres) {
      const res = await db.query(
        `SELECT * FROM packages ORDER BY created_at DESC`
      );
      return res.rows;
    }
    const packages = localDb.findAll('packages');
    return packages.map(p => ({
      id: p.id,
      slug: p.slug || p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title: p.title || p.name,
      destination: p.destination,
      duration_days: p.duration_days || p.days || 3,
      duration_nights: p.duration_nights || p.nights || 2,
      b2c_price: Number(p.b2c_price || p.price || 0),
      b2b_offer_price: Number(p.b2b_offer_price || p.b2b_price || (Number(p.b2c_price || p.price || 0) * 0.8)),
      itinerary_details: p.itinerary_details || p.itinerary || [],
      inclusions: p.inclusions || [],
      exclusions: p.exclusions || [],
      cover_image: p.cover_image || p.image || p.imageUrl,
      is_active: p.is_active !== false && p.status !== 'inactive',
      created_at: p.created_at,
      updated_at: p.updated_at
    }));
  }

  async findById(id) {
    if (db.isPostgres) {
      const res = await db.query('SELECT * FROM packages WHERE id = $1 LIMIT 1', [id]);
      return res.rows[0] || null;
    }
    return localDb.findById('packages', id);
  }

  async create(packageData, client = null) {
    const {
      slug, title, destination, duration_days, duration_nights,
      b2c_price, b2b_offer_price, itinerary_details, inclusions,
      exclusions, cover_image, is_active
    } = packageData;

    if (db.isPostgres) {
      const executor = client || db;
      const res = await executor.query(
        `INSERT INTO packages (
          slug, title, destination, duration_days, duration_nights,
          b2c_price, b2b_offer_price, itinerary_details, inclusions,
          exclusions, cover_image, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          slug, title, destination, duration_days, duration_nights,
          b2c_price, b2b_offer_price, JSON.stringify(itinerary_details || []),
          JSON.stringify(inclusions || []), JSON.stringify(exclusions || []),
          cover_image || null, is_active !== false
        ]
      );
      return res.rows[0];
    }

    const newPkg = {
      id: require('crypto').randomUUID(),
      slug,
      name: title,
      title,
      destination,
      duration_days,
      duration_nights,
      b2c_price,
      price: b2c_price,
      b2b_offer_price,
      b2b_price: b2b_offer_price,
      itinerary_details,
      inclusions,
      exclusions,
      cover_image,
      image: cover_image,
      is_active: is_active !== false,
      status: is_active !== false ? 'active' : 'inactive',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    return localDb.insert('packages', newPkg);
  }

  async update(id, updates) {
    if (db.isPostgres) {
      const fields = [];
      const values = [];
      let idx = 1;

      for (const [key, val] of Object.entries(updates)) {
        fields.push(`${key} = $${idx}`);
        values.push(key.includes('details') || key === 'inclusions' || key === 'exclusions' ? JSON.stringify(val) : val);
        idx++;
      }
      values.push(id);

      const res = await db.query(
        `UPDATE packages SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
        values
      );
      return res.rows[0];
    }

    return localDb.update('packages', id, updates);
  }
}

module.exports = new PackageRepository();
