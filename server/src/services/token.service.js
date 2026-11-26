/**
 * TRIPBYGENIE ENTERPRISE SECURITY: TOKEN & SESSION MANAGEMENT SERVICE
 * Implements Zero-Trust Dual-Token Architecture:
 * - 15-Minute Short-Lived Access Tokens
 * - Cryptographically Secure Rotating Refresh Tokens
 * - SHA-256 Hashed Refresh Token Storage
 * - Token Family Tracking & Reuse Detection (RFC 6749 / BCP 225)
 * - HttpOnly, Secure, SameSite Cookie Delivery
 * - Instant Session Invalidation on Password Change / Admin Suspension
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../../db');

const JWT_SECRET = process.env.JWT_SECRET || 'travel_genie_super_secure_jwt_secret_2026';
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY_DAYS = 7; // 7 days

class TokenService {
  /**
   * Hash token string using SHA-256
   */
  hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Generate raw cryptographically secure random token string
   */
  generateRawToken() {
    return crypto.randomBytes(40).toString('hex');
  }

  /**
   * Create 15-minute access token
   */
  createAccessToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      agency_id: user.agency_id || 'agency_travel_genie',
      name: user.name || user.full_name || '',
      iat: Math.floor(Date.now() / 1000)
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
  }

  /**
   * Issue dual token pair (access token + rotating refresh token)
   */
  async issueTokenPair(user, req = null, res = null, existingFamilyId = null) {
    const accessToken = this.createAccessToken(user);
    const rawRefreshToken = this.generateRawToken();
    const tokenHash = this.hashToken(rawRefreshToken);
    const familyId = existingFamilyId || crypto.randomUUID();
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const userAgent = req && req.headers ? (req.headers['user-agent'] || 'Unknown') : 'Internal';
    const ipAddress = req && (req.ip || req.connection?.remoteAddress || '127.0.0.1');

    // Persist refresh token in database
    db.insert('refresh_tokens', {
      user_id: user.id,
      token_hash: tokenHash,
      family_id: familyId,
      is_revoked: false,
      expires_at: expiresAt,
      user_agent: userAgent,
      ip_address: ipAddress,
      created_at: new Date().toISOString()
    });

    // If HTTP response object available, set HttpOnly Secure Cookie
    if (res && typeof res.cookie === 'function') {
      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie('tg_refresh_token', rawRefreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'None' : 'Lax',
        maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
        path: '/'
      });
    }

    return {
      token: accessToken, // for backward compatibility with existing tests & frontend
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: 900 // 15 minutes in seconds
    };
  }

  /**
   * Rotate Refresh Token with Automatic Reuse Detection
   */
  async rotateRefreshToken(rawRefreshToken, req = null, res = null) {
    if (!rawRefreshToken) {
      const err = new Error('Refresh token is required');
      err.statusCode = 400;
      err.code = 'REFRESH_TOKEN_REQUIRED';
      throw err;
    }

    const tokenHash = this.hashToken(rawRefreshToken);
    const tokenRecord = db.findOne('refresh_tokens', (t) => t.token_hash === tokenHash);

    if (!tokenRecord) {
      const err = new Error('Invalid refresh token');
      err.statusCode = 401;
      err.code = 'INVALID_REFRESH_TOKEN';
      throw err;
    }

    // REUSE DETECTION: If this token was already revoked, someone is replaying it!
    if (tokenRecord.is_revoked) {
      console.warn(`[SECURITY ALERT] Refresh token reuse detected for user ${tokenRecord.user_id}! Revoking entire token family ${tokenRecord.family_id}`);
      this.revokeTokenFamily(tokenRecord.family_id);
      
      if (res && typeof res.clearCookie === 'function') {
        res.clearCookie('tg_refresh_token', { path: '/' });
      }

      const err = new Error('Security breach detected: refresh token reuse. All sessions in this chain have been terminated. Please log in again.');
      err.statusCode = 401;
      err.code = 'TOKEN_REUSE_DETECTED';
      throw err;
    }

    // Expiration check
    if (new Date(tokenRecord.expires_at) < new Date()) {
      db.update('refresh_tokens', tokenRecord.id, { is_revoked: true });
      const err = new Error('Refresh token has expired. Please log in again.');
      err.statusCode = 401;
      err.code = 'REFRESH_TOKEN_EXPIRED';
      throw err;
    }

    // User active check
    const user = db.findById('users', tokenRecord.user_id);
    if (!user || user.status === 'suspended' || user.status === 'inactive' || user.is_active === false) {
      this.revokeTokenFamily(tokenRecord.family_id);
      const err = new Error('User account is deactivated or suspended.');
      err.statusCode = 403;
      err.code = 'ACCOUNT_DISABLED';
      throw err;
    }

    // Check if user has a global invalidation timestamp (e.g. after password reset)
    if (user.tokens_invalidated_before) {
      const tokenCreated = new Date(tokenRecord.created_at).getTime();
      const invalidatedBefore = new Date(user.tokens_invalidated_before).getTime();
      if (tokenCreated < invalidatedBefore) {
        this.revokeTokenFamily(tokenRecord.family_id);
        const err = new Error('Session invalidated by administrative action or password change.');
        err.statusCode = 401;
        err.code = 'SESSION_INVALIDATED';
        throw err;
      }
    }

    // Revoke the old token (single-use rotation)
    db.update('refresh_tokens', tokenRecord.id, {
      is_revoked: true,
      revoked_at: new Date().toISOString()
    });

    // Issue new pair continuing the same family ID
    return await this.issueTokenPair(user, req, res, tokenRecord.family_id);
  }

  /**
   * Revoke an entire family of tokens
   */
  revokeTokenFamily(familyId) {
    if (!familyId) return;
    const tokens = db.findAll('refresh_tokens', (t) => t.family_id === familyId && !t.is_revoked);
    for (const t of tokens) {
      db.update('refresh_tokens', t.id, { is_revoked: true, revoked_at: new Date().toISOString() });
    }
  }

  /**
   * Revoke single token
   */
  revokeToken(rawRefreshToken) {
    if (!rawRefreshToken) return;
    const tokenHash = this.hashToken(rawRefreshToken);
    const record = db.findOne('refresh_tokens', (t) => t.token_hash === tokenHash);
    if (record) {
      db.update('refresh_tokens', record.id, { is_revoked: true, revoked_at: new Date().toISOString() });
    }
  }

  /**
   * Logout from all sessions for user
   */
  revokeAllUserTokens(userId) {
    if (!userId) return;
    const tokens = db.findAll('refresh_tokens', (t) => t.user_id === userId && !t.is_revoked);
    for (const t of tokens) {
      db.update('refresh_tokens', t.id, { is_revoked: true, revoked_at: new Date().toISOString() });
    }
    // Also record invalidation timestamp on user
    db.update('users', userId, {
      tokens_invalidated_before: new Date().toISOString()
    });
  }
}

module.exports = new TokenService();
module.exports.JWT_SECRET = JWT_SECRET;
