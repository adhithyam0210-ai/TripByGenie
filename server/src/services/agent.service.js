/**
 * B2B Agent Reseller Service
 * Wholesale catalog, margin snapshotting, idempotency checks, and white-labeled vouchers
 */

const packageRepository = require('../repositories/package.repository');
const orderRepository = require('../repositories/order.repository');
const userRepository = require('../repositories/user.repository');
const { generateOrderNumber } = require('../utils/codeGenerator');
const { PAYMENT_STATUS } = require('../constants');

class AgentService {
  /**
   * Wholesale Catalog with B2B discount and margins
   */
  async getWholesaleCatalog() {
    return await packageRepository.findAllForAgent();
  }

  /**
   * Create Wholesale Order with Snapshot Pricing and Idempotency Guard
   */
  async createWholesaleOrder(agentId, payload) {
    const { package_id, pax_count, traveler_details, agent_selling_price, idempotency_key } = payload;

    if (!package_id || !pax_count || !agent_selling_price) {
      const err = new Error('Package ID, pax count and agent selling price are required');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    // 1. Idempotency Check
    if (idempotency_key) {
      const existingOrder = await orderRepository.findByIdempotencyKey(idempotency_key);
      if (existingOrder) {
        return {
          order: existingOrder,
          is_duplicate_replay: true
        };
      }
    }

    // 2. Fetch package to snapshot the wholesale price
    const pkg = await packageRepository.findById(package_id);
    if (!pkg || pkg.is_active === false) {
      const err = new Error('Specified package does not exist or is inactive');
      err.statusCode = 404;
      err.code = 'PACKAGE_NOT_FOUND';
      throw err;
    }

    const pax = parseInt(pax_count, 10);
    const b2bUnitCost = Number(pkg.b2b_offer_price || pkg.b2b_price || (Number(pkg.b2c_price || pkg.price) * 0.8));
    const totalWholesaleCost = b2bUnitCost * pax;
    const sellingPrice = Number(agent_selling_price);

    // 3. Margin Validation: Agent cannot resell below wholesale acquisition cost
    if (sellingPrice < totalWholesaleCost) {
      const err = new Error(`Agent selling price (₹${sellingPrice}) cannot be lower than total wholesale cost (₹${totalWholesaleCost})`);
      err.statusCode = 400;
      err.code = 'BELOW_WHOLESALE_COST';
      throw err;
    }

    const agentProfit = sellingPrice - totalWholesaleCost;
    const orderNumber = generateOrderNumber();

    // 4. Create Order Record
    const order = await orderRepository.create({
      order_number: orderNumber,
      agent_id: agentId,
      package_id: pkg.id,
      pax_count: pax,
      traveler_details: traveler_details || [],
      b2b_unit_cost: b2bUnitCost,
      total_wholesale_cost: totalWholesaleCost,
      agent_selling_price: sellingPrice,
      agent_profit: agentProfit,
      payment_status: PAYMENT_STATUS.PENDING,
      idempotency_key: idempotency_key || null
    });

    return {
      order,
      is_duplicate_replay: false
    };
  }

  /**
   * Process Payment Gateway Webhook (Stripe/Razorpay simulated)
   */
  async handlePaymentWebhook(payload, signature) {
    const { order_number, payment_reference, event } = payload;

    if (!order_number) {
      const err = new Error('Order number is required in webhook payload');
      err.statusCode = 400;
      err.code = 'WEBHOOK_VALIDATION_ERROR';
      throw err;
    }

    // In production, HMAC signature would be verified with gateway webhook secret
    const order = await orderRepository.findById(payload.order_id || payload.order_number);
    let targetOrderId = order ? order.id : null;

    if (!targetOrderId) {
      // Find by order_number
      const allOrders = await orderRepository.findAllForAdmin();
      const matched = allOrders.find(o => o.order_number === order_number);
      if (matched) targetOrderId = matched.id;
    }

    if (!targetOrderId) {
      const err = new Error(`Order '${order_number}' not found`);
      err.statusCode = 404;
      err.code = 'ORDER_NOT_FOUND';
      throw err;
    }

    const updatedOrder = await orderRepository.updatePaymentStatus(
      targetOrderId,
      PAYMENT_STATUS.PAID,
      payment_reference || `PAY_REF_${Date.now()}`
    );

    return updatedOrder;
  }

  /**
   * White-Labeled Client Voucher
   */
  async getWhiteLabeledVoucher(orderId, agentId) {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      const err = new Error(`Order '${orderId}' not found`);
      err.statusCode = 404;
      err.code = 'ORDER_NOT_FOUND';
      throw err;
    }

    // Ensure order belongs to this agent
    if (order.agent_id !== agentId) {
      const err = new Error('Access denied: you can only download vouchers for your own orders');
      err.statusCode = 403;
      err.code = 'FORBIDDEN_ORDER_ACCESS';
      throw err;
    }

    if (order.payment_status !== PAYMENT_STATUS.PAID && order.status !== 'CONFIRMED') {
      const err = new Error('Voucher is locked. Payment must be confirmed before downloading vouchers.');
      err.statusCode = 400;
      err.code = 'PAYMENT_PENDING';
      throw err;
    }

    const agent = await userRepository.findById(agentId);

    return {
      voucher_type: 'WHITE_LABELED_TRAVEL_VOUCHER',
      order_number: order.order_number,
      booking_date: order.created_at,
      reseller_agency: {
        agent_code: agent.user_code,
        agent_name: agent.full_name,
        contact_email: agent.email
      },
      package: {
        title: order.package_title,
        destination: order.destination,
        duration_days: order.duration_days,
        itinerary: order.itinerary_details
      },
      travelers: order.traveler_details || order.travelers || [],
      pax_count: order.pax_count,
      client_paid_amount: order.agent_selling_price, // Client sees retail price, NEVER wholesale cost
      status: 'CONFIRMED'
    };
  }
}

module.exports = new AgentService();
