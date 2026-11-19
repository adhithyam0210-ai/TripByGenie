/**
 * Authentication & Identity Controller
 */

const authService = require('../services/auth.service');
const { sendSuccess } = require('../utils/response');

class AuthController {
  async signUp(req, res, next) {
    try {
      const result = await authService.signUp(req.body);
      return sendSuccess(res, result, 201, { message: 'Account successfully registered' });
    } catch (err) {
      next(err);
    }
  }

  async login(req, res, next) {
    try {
      const identifier = req.body.identifier || req.body.email || req.body.user_code;
      const password = req.body.password;
      const result = await authService.login(identifier, password);
      return sendSuccess(res, result, 200, { message: 'Authentication successful' });
    } catch (err) {
      next(err);
    }
  }

  async getProfile(req, res, next) {
    try {
      return sendSuccess(res, { user: req.user });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
