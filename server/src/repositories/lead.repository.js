/**
 * CRM Lead & Interaction Data Access Repository
 * Powers the sales pipeline, assignment engine, and customer communication log
 */

const db = require('../config/database');
const localDb = require('../../db');

class LeadRepository {
  async create(leadData, client = null) {
    const {
      customer_id, package_id, assigned_staff_id, travel_date,
      pax_count, pipeline_stage, quoted_price, source, customer_notes
    } = leadData;

    if (db.isPostgres) {
      const executor = client || db;
      const res = await executor.query(
        `INSERT INTO crm_leads (
          customer_id, package_id, assigned_staff_id, travel_date,
          pax_count, pipeline_stage, quoted_price, source, customer_notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          customer_id, package_id, assigned_staff_id || null,
          travel_date || null, pax_count || 2, pipeline_stage || 'NEW',
          quoted_price || null, source || 'WEBSITE_ENQUIRY', customer_notes || null
        ]
      );
      return res.rows[0];
    }

    const newLead = {
      id: require('crypto').randomUUID(),
      customer_id,
      customer_name: leadData.customer_name || 'Valued Traveler',
      customer_email: leadData.customer_email,
      customer_phone: leadData.customer_phone,
      package_id,
      package_name: leadData.package_title || 'Custom Tour',
      assigned_staff_id: assigned_staff_id || null,
      travel_date: travel_date || null,
      pax_count: pax_count || 2,
      pipeline_stage: pipeline_stage || 'NEW',
      status: pipeline_stage || 'NEW',
      stage: pipeline_stage || 'NEW',
      quoted_price: quoted_price || null,
      source: source || 'WEBSITE_ENQUIRY',
      customer_notes: customer_notes || null,
      notes: customer_notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    return localDb.insert('leads', newLead);
  }

  async findById(id) {
    if (db.isPostgres) {
      const res = await db.query(
        `SELECT l.*,
                u.full_name AS customer_name, u.email AS customer_email, u.phone AS customer_phone,
                p.title AS package_title, p.destination, p.b2c_price,
                s.full_name AS assigned_staff_name
         FROM crm_leads l
         JOIN users u ON l.customer_id = u.id
         JOIN packages p ON l.package_id = p.id
         LEFT JOIN users s ON l.assigned_staff_id = s.id
         WHERE l.id = $1`,
        [id]
      );
      return res.rows[0] || null;
    }
    return localDb.findById('leads', id);
  }

  async findUnassigned(stage = null) {
    if (db.isPostgres) {
      let query = `
        SELECT l.*,
               u.full_name AS customer_name, u.email AS customer_email, u.phone AS customer_phone,
               p.title AS package_title, p.destination
        FROM crm_leads l
        JOIN users u ON l.customer_id = u.id
        JOIN packages p ON l.package_id = p.id
        WHERE l.assigned_staff_id IS NULL
      `;
      const params = [];
      if (stage) {
        query += ` AND l.pipeline_stage = $1`;
        params.push(stage);
      }
      query += ` ORDER BY l.created_at DESC`;
      const res = await db.query(query, params);
      return res.rows;
    }

    return localDb.findAll('leads', l => {
      const isUnassigned = !l.assigned_staff_id && !l.assigned_to;
      if (stage) {
        return isUnassigned && (l.pipeline_stage === stage || l.status === stage);
      }
      return isUnassigned;
    });
  }

  async findAllForAdmin(filters = {}) {
    if (db.isPostgres) {
      let queryText = `
        SELECT l.*,
               u.full_name AS customer_name, u.email AS customer_email, u.phone AS customer_phone,
               p.title AS package_title, p.destination,
               s.full_name AS assigned_staff_name
        FROM crm_leads l
        JOIN users u ON l.customer_id = u.id
        JOIN packages p ON l.package_id = p.id
        LEFT JOIN users s ON l.assigned_staff_id = s.id
        WHERE 1=1
      `;
      const params = [];
      if (filters.status) {
        params.push(filters.status);
        queryText += ` AND l.pipeline_stage = $${params.length}`;
      }
      if (filters.staffId) {
        params.push(filters.staffId);
        queryText += ` AND l.assigned_staff_id = $${params.length}`;
      }
      queryText += ` ORDER BY l.created_at DESC`;
      const res = await db.query(queryText, params);
      return res.rows;
    }

    return localDb.findAll('leads', l => {
      if (filters.status && (l.pipeline_stage !== filters.status && l.status !== filters.status)) return false;
      if (filters.staffId && l.assigned_staff_id !== filters.staffId && l.assigned_to !== filters.staffId) return false;
      return true;
    });
  }

  async findByStaffQueue(staffId, stage = null) {
    if (db.isPostgres) {
      let queryText = `
        SELECT l.*,
               u.full_name AS customer_name, u.email AS customer_email, u.phone AS customer_phone,
               p.title AS package_title, p.destination, p.b2c_price
        FROM crm_leads l
        JOIN users u ON l.customer_id = u.id
        JOIN packages p ON l.package_id = p.id
        WHERE l.assigned_staff_id = $1
      `;
      const params = [staffId];
      if (stage) {
        params.push(stage);
        queryText += ` AND l.pipeline_stage = $2`;
      }
      queryText += ` ORDER BY l.created_at DESC`;
      const res = await db.query(queryText, params);
      return res.rows;
    }

    return localDb.findAll('leads', l => {
      const matchesStaff = l.assigned_staff_id === staffId || l.assigned_to === staffId;
      if (!matchesStaff) return false;
      if (stage) return (l.pipeline_stage === stage || l.status === stage);
      return true;
    });
  }

  async assignToStaff(leadId, staffId) {
    if (db.isPostgres) {
      const res = await db.query(
        `UPDATE crm_leads
         SET assigned_staff_id = $1,
             pipeline_stage = CASE WHEN pipeline_stage = 'NEW' THEN 'ASSIGNED'::lead_pipeline_stage ELSE pipeline_stage END
         WHERE id = $2
         RETURNING *`,
        [staffId, leadId]
      );
      return res.rows[0];
    }

    const current = localDb.findById('leads', leadId);
    if (!current) return null;
    const newStage = (current.pipeline_stage === 'NEW' || current.status === 'NEW') ? 'ASSIGNED' : (current.pipeline_stage || current.status);
    return localDb.update('leads', leadId, {
      assigned_staff_id: staffId,
      assigned_to: staffId,
      pipeline_stage: newStage,
      status: newStage,
      stage: newStage
    });
  }

  async updateStage(leadId, stage, quotedPrice = null, nextFollowupAt = null) {
    if (db.isPostgres) {
      const res = await db.query(
        `UPDATE crm_leads
         SET pipeline_stage = $1,
             quoted_price = COALESCE($2, quoted_price),
             next_followup_at = COALESCE($3, next_followup_at)
         WHERE id = $4
         RETURNING *`,
        [stage, quotedPrice, nextFollowupAt, leadId]
      );
      return res.rows[0];
    }

    const updates = { pipeline_stage: stage, status: stage, stage };
    if (quotedPrice !== null && quotedPrice !== undefined) updates.quoted_price = quotedPrice;
    if (nextFollowupAt) updates.next_followup_at = nextFollowupAt;
    return localDb.update('leads', leadId, updates);
  }

  async createInteraction(interactionData, client = null) {
    const { lead_id, staff_id, channel, summary } = interactionData;

    if (db.isPostgres) {
      const executor = client || db;
      const res = await executor.query(
        `INSERT INTO lead_interactions (lead_id, staff_id, channel, summary)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [lead_id, staff_id, channel, summary]
      );
      return res.rows[0];
    }

    const newInteraction = {
      id: require('crypto').randomUUID(),
      lead_id,
      staff_id,
      channel,
      summary,
      created_at: new Date().toISOString()
    };
    return localDb.insert('interactions', newInteraction);
  }

  async findInteractionsByLead(leadId) {
    if (db.isPostgres) {
      const res = await db.query(
        `SELECT i.*, u.full_name AS staff_name, u.user_code AS staff_code
         FROM lead_interactions i
         JOIN users u ON i.staff_id = u.id
         WHERE i.lead_id = $1
         ORDER BY i.created_at DESC`,
        [leadId]
      );
      return res.rows;
    }
    return localDb.findAll('interactions', i => i.lead_id === leadId);
  }
}

module.exports = new LeadRepository();
