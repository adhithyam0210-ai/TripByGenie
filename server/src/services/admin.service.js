/**
 * Admin Governance & Operations Service
 * CMS Management, User Provisioning, Lead Assignment, and Wholesale Revenue Audits
 */

const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/user.repository');
const packageRepository = require('../repositories/package.repository');
const bannerRepository = require('../repositories/banner.repository');
const leadRepository = require('../repositories/lead.repository');
const orderRepository = require('../repositories/order.repository');
const { generateUserCode } = require('../utils/codeGenerator');
const { ROLES } = require('../constants');

class AdminService {
  /**
   * Provision Staff or Agent Accounts
   */
  async provisionUser(creatorId, userData) {
    const { full_name, email, phone, role, password } = userData;

    if (!full_name || !email || !password || !role) {
      const err = new Error('Full name, email, password and role are required');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    const formattedRole = role.toUpperCase();
    if (formattedRole !== ROLES.STAFF && formattedRole !== ROLES.AGENT) {
      const err = new Error(`Admin can only provision STAFF or AGENT roles. Provided: ${role}`);
      err.statusCode = 400;
      err.code = 'INVALID_PROVISIONING_ROLE';
      throw err;
    }

    const existing = await userRepository.findByEmail(email);
    if (existing) {
      const err = new Error('An account with this email address already exists');
      err.statusCode = 409;
      err.code = 'DUPLICATE_EMAIL';
      throw err;
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const user_code = generateUserCode(formattedRole);

    const newUser = await userRepository.create({
      user_code,
      full_name,
      email,
      phone,
      password_hash,
      role: formattedRole,
      created_by: creatorId
    });

    return {
      id: newUser.id,
      user_code: newUser.user_code,
      full_name: newUser.full_name,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      initial_password: password // Returned once to Admin for credential handover
    };
  }

  /**
   * Create Tour Package with Dual Pricing Validation
   */
  async createPackage(packageData) {
    const { title, destination, b2c_price, b2b_offer_price } = packageData;

    if (!title || !destination || b2c_price === undefined || b2b_offer_price === undefined) {
      const err = new Error('Title, destination, b2c_price, and b2b_offer_price are required');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    const numB2C = Number(b2c_price);
    const numB2B = Number(b2b_offer_price);

    if (numB2B > numB2C) {
      const err = new Error(`Wholesale B2B offer price (₹${numB2B}) cannot exceed B2C public retail price (₹${numB2C})`);
      err.statusCode = 400;
      err.code = 'INVALID_DUAL_PRICING';
      throw err;
    }

    const slug = (packageData.slug || title).toLowerCase().replace(/[^a-z0-9]+/g, '-');

    return await packageRepository.create({
      ...packageData,
      slug,
      b2c_price: numB2C,
      b2b_offer_price: numB2B
    });
  }

  /**
   * Assign or Reassign Lead to Staff Member
   */
  async assignLead(leadId, staffId) {
    const lead = await leadRepository.findById(leadId);
    if (!lead) {
      const err = new Error(`Lead with ID '${leadId}' not found`);
      err.statusCode = 404;
      err.code = 'LEAD_NOT_FOUND';
      throw err;
    }

    const staffUser = await userRepository.findById(staffId);
    if (!staffUser || staffUser.role !== ROLES.STAFF) {
      const err = new Error(`Assigned user '${staffId}' is not an active staff member`);
      err.statusCode = 400;
      err.code = 'INVALID_STAFF_ASSIGNMENT';
      throw err;
    }

    const updatedLead = await leadRepository.assignToStaff(leadId, staffId);

    // Auto-record system interaction note
    await leadRepository.createInteraction({
      lead_id: leadId,
      staff_id: staffId,
      channel: 'NOTE',
      summary: `Lead assigned to ${staffUser.full_name} (${staffUser.user_code}) by Administrator`
    });

    return updatedLead;
  }

  /**
   * B2B Wholesale Revenue & Ledger Audit
   */
  async getOrdersAudit() {
    const orders = await orderRepository.findAllForAdmin();
    const totalWholesale = orders.reduce((sum, o) => sum + Number(o.total_wholesale_cost || 0), 0);
    const totalAgentResale = orders.reduce((sum, o) => sum + Number(o.agent_selling_price || 0), 0);
    const totalAgentProfit = orders.reduce((sum, o) => sum + Number(o.agent_profit || 0), 0);

    return {
      metrics: {
        total_orders_count: orders.length,
        total_wholesale_volume: totalWholesale,
        total_agent_resale_volume: totalAgentResale,
        total_agent_retained_profit: totalAgentProfit
      },
      orders
    };
  }
}

module.exports = new AdminService();
