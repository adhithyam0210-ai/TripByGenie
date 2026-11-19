/**
 * Staff CRM Pipeline & Follow-up Operations Service
 * Enforces ownership isolation: staff can only manage their assigned queue
 */

const leadRepository = require('../repositories/lead.repository');
const { PIPELINE_STAGES, STAGE_TRANSITIONS, INTERACTION_CHANNELS } = require('../constants');

class StaffService {
  /**
   * Fetch only leads assigned to this specific staff member
   */
  async getMyQueue(staffId, stage = null) {
    return await leadRepository.findByStaffQueue(staffId, stage);
  }

  /**
   * Log communication interactions (Call, WhatsApp, Email, Note)
   */
  async logInteraction(leadId, staffId, payload) {
    const { channel, summary } = payload;

    if (!channel || !summary) {
      const err = new Error('Channel and summary are required');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    const formattedChannel = channel.toUpperCase();
    if (!INTERACTION_CHANNELS[formattedChannel]) {
      const err = new Error(`Invalid interaction channel '${channel}'. Allowed: [${Object.keys(INTERACTION_CHANNELS).join(', ')}]`);
      err.statusCode = 400;
      err.code = 'INVALID_CHANNEL';
      throw err;
    }

    // Verify staff ownership of the lead
    const lead = await leadRepository.findById(leadId);
    if (!lead) {
      const err = new Error(`Lead '${leadId}' not found`);
      err.statusCode = 404;
      err.code = 'LEAD_NOT_FOUND';
      throw err;
    }

    if (lead.assigned_staff_id && lead.assigned_staff_id !== staffId && lead.assigned_to !== staffId) {
      const err = new Error('Access denied: you can only log interactions on your assigned leads');
      err.statusCode = 403;
      err.code = 'FORBIDDEN_LEAD_ACCESS';
      throw err;
    }

    const interaction = await leadRepository.createInteraction({
      lead_id: leadId,
      staff_id: staffId,
      channel: formattedChannel,
      summary
    });

    return interaction;
  }

  /**
   * Move lead across pipeline stages enforcing state machine transitions
   */
  async updateStage(leadId, staffId, payload) {
    const { stage, quoted_price, next_followup_at } = payload;

    if (!stage) {
      const err = new Error('Pipeline stage is required');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    const targetStage = stage.toUpperCase();
    if (!PIPELINE_STAGES[targetStage]) {
      const err = new Error(`Invalid pipeline stage '${stage}'. Allowed: [${Object.keys(PIPELINE_STAGES).join(', ')}]`);
      err.statusCode = 400;
      err.code = 'INVALID_PIPELINE_STAGE';
      throw err;
    }

    const lead = await leadRepository.findById(leadId);
    if (!lead) {
      const err = new Error(`Lead '${leadId}' not found`);
      err.statusCode = 404;
      err.code = 'LEAD_NOT_FOUND';
      throw err;
    }

    if (lead.assigned_staff_id && lead.assigned_staff_id !== staffId && lead.assigned_to !== staffId) {
      const err = new Error('Access denied: you can only update stages on your assigned leads');
      err.statusCode = 403;
      err.code = 'FORBIDDEN_LEAD_ACCESS';
      throw err;
    }

    const currentStage = (lead.pipeline_stage || lead.status || 'NEW').toUpperCase();

    // Check state transition rules
    const allowedNext = STAGE_TRANSITIONS[currentStage] || [];
    if (currentStage !== targetStage && !allowedNext.includes(targetStage)) {
      const err = new Error(`Illegal stage transition from '${currentStage}' to '${targetStage}'. Permitted transitions: [${allowedNext.join(', ')}]`);
      err.statusCode = 400;
      err.code = 'ILLEGAL_STAGE_TRANSITION';
      throw err;
    }

    const updated = await leadRepository.updateStage(leadId, targetStage, quoted_price, next_followup_at);

    // Record audit interaction note
    await leadRepository.createInteraction({
      lead_id: leadId,
      staff_id: staffId,
      channel: 'NOTE',
      summary: `Stage transitioned from ${currentStage} to ${targetStage}${quoted_price ? ` with quote: ₹${quoted_price}` : ''}`
    });

    return updated;
  }

  /**
   * Trigger verified voucher issuance upon CONVERTED stage
   */
  async triggerVoucher(leadId, staffId) {
    const lead = await leadRepository.findById(leadId);
    if (!lead) {
      const err = new Error(`Lead '${leadId}' not found`);
      err.statusCode = 404;
      err.code = 'LEAD_NOT_FOUND';
      throw err;
    }

    const currentStage = (lead.pipeline_stage || lead.status || '').toUpperCase();
    if (currentStage !== 'CONVERTED') {
      const err = new Error(`Vouchers can only be issued for leads in 'CONVERTED' stage. Current stage: '${currentStage}'`);
      err.statusCode = 400;
      err.code = 'VOUCHER_STAGE_UNSATISFIED';
      throw err;
    }

    const voucherNumber = `VCH-${Date.now().toString().slice(-6)}`;
    const voucherData = {
      voucher_number: voucherNumber,
      issued_at: new Date().toISOString(),
      lead_id: lead.id,
      customer_name: lead.customer_name,
      customer_email: lead.customer_email,
      customer_phone: lead.customer_phone,
      package_title: lead.package_title,
      destination: lead.destination,
      pax_count: lead.pax_count,
      travel_date: lead.travel_date,
      quoted_final_price: lead.quoted_price || lead.b2c_price,
      issued_by_staff_id: staffId,
      status: 'VERIFIED_AND_ACTIVE'
    };

    // Log voucher generation
    await leadRepository.createInteraction({
      lead_id: leadId,
      staff_id: staffId,
      channel: 'NOTE',
      summary: `Travel Voucher generated and issued: ${voucherNumber}`
    });

    return voucherData;
  }
}

module.exports = new StaffService();
