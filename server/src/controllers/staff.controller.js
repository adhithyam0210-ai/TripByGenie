/**
 * Staff CRM Controller
 */

const staffService = require('../services/staff.service');
const leadRepository = require('../repositories/lead.repository');
const { sendSuccess } = require('../utils/response');

class StaffController {
  async getMyQueue(req, res, next) {
    try {
      const queue = await staffService.getMyQueue(req.user.id, req.query.stage);
      return sendSuccess(res, queue, 200, {
        staff_id: req.user.id,
        count: queue.length
      });
    } catch (err) {
      next(err);
    }
  }

  async logInteraction(req, res, next) {
    try {
      const interaction = await staffService.logInteraction(req.params.leadId, req.user.id, req.body);
      return sendSuccess(res, interaction, 201, { message: 'Interaction note recorded' });
    } catch (err) {
      next(err);
    }
  }

  async getInteractions(req, res, next) {
    try {
      const interactions = await leadRepository.findInteractionsByLead(req.params.leadId);
      return sendSuccess(res, interactions);
    } catch (err) {
      next(err);
    }
  }

  async updateStage(req, res, next) {
    try {
      const updated = await staffService.updateStage(req.params.leadId, req.user.id, req.body);
      return sendSuccess(res, updated, 200, { message: `Lead moved to stage ${req.body.stage}` });
    } catch (err) {
      next(err);
    }
  }

  async triggerVoucher(req, res, next) {
    try {
      const voucher = await staffService.triggerVoucher(req.params.leadId, req.user.id);
      return sendSuccess(res, voucher, 200, { message: 'Travel voucher issued successfully' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new StaffController();
