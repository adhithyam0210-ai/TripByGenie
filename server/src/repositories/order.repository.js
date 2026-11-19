/**
 * B2B Agent Wholesale Orders & Ledger Data Access Repository
 * Enforces price snapshotting, idempotency checks, and margin tracking
 */

const db = require('../config/database');
const localDb = require('../../db');

class OrderRepository {
  async findByIdempotencyKey(key) {
    if (!key) return null;
    if (db.isPostgres) {
      const res = await db.query(
        'SELECT * FROM agent_orders WHERE idempotency_key = $1 LIMIT 1',
        [key]
      );
      return res.rows[0] || null;
    }
    return localDb.findOne('bookings', b => b.idempotency_key === key);
  }

  async findById(id) {
    if (db.isPostgres) {
      const res = await db.query(
        `SELECT o.*,
                u.full_name AS agent_name, u.email AS agent_email, u.user_code AS agent_code,
                p.title AS package_title, p.destination, p.duration_days, p.itinerary_details
         FROM agent_orders o
         JOIN users u ON o.agent_id = u.id
         JOIN packages p ON o.package_id = p.id
         WHERE o.id = $1`,
        [id]
      );
      return res.rows[0] || null;
    }
    return localDb.findById('bookings', id);
  }

  async create(orderData, client = null) {
    const {
      order_number, agent_id, package_id, pax_count, traveler_details,
      b2b_unit_cost, total_wholesale_cost, agent_selling_price,
      agent_profit, payment_status, idempotency_key
    } = orderData;

    if (db.isPostgres) {
      const executor = client || db;
      const res = await executor.query(
        `INSERT INTO agent_orders (
          order_number, agent_id, package_id, pax_count, traveler_details,
          b2b_unit_cost, total_wholesale_cost, agent_selling_price,
          agent_profit, payment_status, idempotency_key
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          order_number, agent_id, package_id, pax_count,
          JSON.stringify(traveler_details || []),
          b2b_unit_cost, total_wholesale_cost, agent_selling_price,
          agent_profit, payment_status || 'PENDING', idempotency_key || null
        ]
      );
      return res.rows[0];
    }

    const newBooking = {
      id: require('crypto').randomUUID(),
      order_number,
      booking_number: order_number,
      agent_id,
      package_id,
      pax_count,
      travelers: traveler_details,
      traveler_details,
      b2b_unit_cost,
      total_wholesale_cost,
      agent_selling_price,
      total_price: agent_selling_price,
      agent_profit,
      payment_status: payment_status || 'PENDING',
      status: payment_status === 'PAID' ? 'CONFIRMED' : 'PENDING',
      idempotency_key,
      voucher_issued: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    return localDb.insert('bookings', newBooking);
  }

  async findByAgentId(agentId) {
    if (db.isPostgres) {
      const res = await db.query(
        `SELECT o.*, p.title AS package_title, p.destination
         FROM agent_orders o
         JOIN packages p ON o.package_id = p.id
         WHERE o.agent_id = $1
         ORDER BY o.created_at DESC`,
        [agentId]
      );
      return res.rows;
    }
    return localDb.findAll('bookings', b => b.agent_id === agentId);
  }

  async findAllForAdmin() {
    if (db.isPostgres) {
      const res = await db.query(
        `SELECT o.*,
                u.full_name AS agent_name, u.user_code AS agent_code,
                p.title AS package_title
         FROM agent_orders o
         JOIN users u ON o.agent_id = u.id
         JOIN packages p ON o.package_id = p.id
         ORDER BY o.created_at DESC`
      );
      return res.rows;
    }
    return localDb.findAll('bookings');
  }

  async updatePaymentStatus(orderId, paymentStatus, gatewayRef = null) {
    if (db.isPostgres) {
      const res = await db.query(
        `UPDATE agent_orders
         SET payment_status = $1,
             payment_gateway_ref = COALESCE($2, payment_gateway_ref),
             voucher_issued = CASE WHEN $1 = 'PAID' THEN TRUE ELSE voucher_issued END
         WHERE id = $3
         RETURNING *`,
        [paymentStatus, gatewayRef, orderId]
      );
      return res.rows[0];
    }

    return localDb.update('bookings', orderId, {
      payment_status: paymentStatus,
      status: paymentStatus === 'PAID' ? 'CONFIRMED' : 'PENDING',
      payment_gateway_ref: gatewayRef,
      voucher_issued: paymentStatus === 'PAID'
    });
  }
}

module.exports = new OrderRepository();
