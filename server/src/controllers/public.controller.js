/**
 * Public Landing Data Controller
 */

const publicService = require('../services/public.service');
const { sendSuccess } = require('../utils/response');

class PublicController {
  async getLandingData(req, res, next) {
    try {
      const data = await publicService.getLandingData();
      return sendSuccess(res, data, 200, {
        timestamp: new Date().toISOString(),
        pricing_tier: 'B2C_RETAIL_ONLY'
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PublicController();
