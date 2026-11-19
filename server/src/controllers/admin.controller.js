/**
 * Admin Governance & CMS Controller
 */

const adminService = require('../services/admin.service');
const packageRepository = require('../repositories/package.repository');
const bannerRepository = require('../repositories/banner.repository');
const leadRepository = require('../repositories/lead.repository');
const userRepository = require('../repositories/user.repository');
const { sendSuccess } = require('../utils/response');

class AdminController {
  async getPackages(req, res, next) {
    try {
      const packages = await packageRepository.findAllForAdmin();
      return sendSuccess(res, packages);
    } catch (err) {
      next(err);
    }
  }

  async createPackage(req, res, next) {
    try {
      const created = await adminService.createPackage(req.body);
      return sendSuccess(res, created, 201, { message: 'Package successfully created with dual-pricing rules' });
    } catch (err) {
      next(err);
    }
  }

  async updatePackage(req, res, next) {
    try {
      const updated = await packageRepository.update(req.params.id, req.body);
      return sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  }

  async getBanners(req, res, next) {
    try {
      const banners = await bannerRepository.findAll();
      return sendSuccess(res, banners);
    } catch (err) {
      next(err);
    }
  }

  async createBanner(req, res, next) {
    try {
      const banner = await bannerRepository.create(req.body);
      return sendSuccess(res, banner, 201);
    } catch (err) {
      next(err);
    }
  }

  async updateBanner(req, res, next) {
    try {
      const banner = await bannerRepository.update(req.params.id, req.body);
      return sendSuccess(res, banner);
    } catch (err) {
      next(err);
    }
  }

  async deleteBanner(req, res, next) {
    try {
      await bannerRepository.delete(req.params.id);
      return sendSuccess(res, { deleted: true });
    } catch (err) {
      next(err);
    }
  }

  async provisionUser(req, res, next) {
    try {
      const provisioned = await adminService.provisionUser(req.user.id, req.body);
      return sendSuccess(res, provisioned, 201, { message: `Account created with code ${provisioned.user_code}` });
    } catch (err) {
      next(err);
    }
  }

  async getStaffList(req, res, next) {
    try {
      const staff = await userRepository.findAllByRole('STAFF');
      return sendSuccess(res, staff);
    } catch (err) {
      next(err);
    }
  }

  async getAgentsList(req, res, next) {
    try {
      const agents = await userRepository.findAllByRole('AGENT');
      return sendSuccess(res, agents);
    } catch (err) {
      next(err);
    }
  }

  async getLeads(req, res, next) {
    try {
      const leads = await leadRepository.findAllForAdmin(req.query);
      return sendSuccess(res, leads);
    } catch (err) {
      next(err);
    }
  }

  async assignLead(req, res, next) {
    try {
      const { staff_id } = req.body;
      const leadId = req.params.leadId;
      const updated = await adminService.assignLead(leadId, staff_id);
      return sendSuccess(res, updated, 200, { message: 'Lead assigned and transitioned to ASSIGNED stage' });
    } catch (err) {
      next(err);
    }
  }

  async getOrdersAudit(req, res, next) {
    try {
      const audit = await adminService.getOrdersAudit();
      return sendSuccess(res, audit);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AdminController();
