/**
 * B2B Agent Reseller Controller
 */

const agentService = require('../services/agent.service');
const orderRepository = require('../repositories/order.repository');
const { sendSuccess } = require('../utils/response');

class AgentController {
  async getCatalog(req, res, next) {
    try {
      const catalog = await agentService.getWholesaleCatalog();
      return sendSuccess(res, catalog, 200, {
        tier: 'B2B_WHOLESALE',
        pricing: 'WHOLESALE_DISCOUNT_APPLIED'
      });
    } catch (err) {
      next(err);
    }
  }

  async createOrder(req, res, next) {
    try {
      const result = await agentService.createWholesaleOrder(req.user.id, req.body);
      const statusCode = result.is_duplicate_replay ? 200 : 201;
      return sendSuccess(res, result.order, statusCode, {
        is_idempotent_replay: result.is_duplicate_replay,
        message: result.is_duplicate_replay ? 'Order already recorded (idempotent replay)' : 'Wholesale order generated'
      });
    } catch (err) {
      next(err);
    }
  }

  async getMyOrders(req, res, next) {
    try {
      const orders = await orderRepository.findByAgentId(req.user.id);
      return sendSuccess(res, orders);
    } catch (err) {
      next(err);
    }
  }

  async getOrderById(req, res, next) {
    try {
      const order = await orderRepository.findById(req.params.orderId);
      if (!order) {
        const err = new Error('Order not found');
        err.statusCode = 404;
        throw err;
      }
      return sendSuccess(res, order);
    } catch (err) {
      next(err);
    }
  }

  async getVoucher(req, res, next) {
    try {
      const voucher = await agentService.getWhiteLabeledVoucher(req.params.orderId, req.user.id);
      return sendSuccess(res, voucher, 200, {
        type: 'WHITE_LABEL',
        download_ready: true
      });
    } catch (err) {
      next(err);
    }
  }

  async handlePaymentWebhook(req, res, next) {
    try {
      const signature = req.headers['x-razorpay-signature'] || req.headers['stripe-signature'];
      const updatedOrder = await agentService.handlePaymentWebhook(req.body, signature);
      return sendSuccess(res, updatedOrder, 200, { received: true });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AgentController();
