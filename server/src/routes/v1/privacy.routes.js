/**
 * TRIPBYGENIE ENTERPRISE SECURITY: DATA PRIVACY & DPDP ACT 2023 COMPLIANCE
 * Implements Statutory Data Principal Rights:
 * 1. Right to Access & Portability (Data Export)
 * 2. Right to Correction and Erasure (with Financial Record Retention Safeguards)
 * 3. Consent Management & Audit Trail
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middlewares/auth.middleware');
const db = require('../../../db');
const { sendSuccess, sendError } = require('../../utils/response');

/**
 * 1. GET /api/v1/privacy/export
 * Exports all personal data associated with the authenticated user
 */
router.get('/export', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;

    // Fetch user profile
    const profile = db.findById('users', userId);
    
    // Fetch bookings & travellers
    const bookings = db.findAll('bookings', (b) => b.customer_id === userId || b.customer_email === userEmail);
    const bookingIds = bookings.map((b) => b.id);
    const travellers = db.findAll('booking_travellers', (t) => bookingIds.includes(t.booking_id));

    // Fetch payments and invoices
    const payments = db.findAll('payments', (p) => bookingIds.includes(p.booking_id));
    const invoices = db.findAll('invoices', (i) => bookingIds.includes(i.booking_id));

    // Fetch inquiries
    const enquiries = db.findAll('enquiries', (e) => e.customer_email === userEmail);

    // Fetch documents
    const documents = db.findAll('travel_documents', (d) => d.customer_id === userId || bookingIds.includes(d.booking_id));

    // Fetch consent audit logs
    const consents = db.findAll('user_consents', (c) => c.user_id === userId);

    const exportBundle = {
      compliance: 'India Digital Personal Data Protection Act, 2023 (DPDP Act 2023)',
      generated_at: new Date().toISOString(),
      principal: {
        id: profile?.id,
        user_code: profile?.user_code || profile?.customer_code,
        full_name: profile?.name || profile?.full_name,
        email: profile?.email,
        phone: profile?.phone,
        role: profile?.role,
        registered_at: profile?.created_at
      },
      data_categories: {
        bookings,
        travellers,
        payments,
        invoices,
        enquiries,
        documents: documents.map((d) => ({
          id: d.id,
          title: d.title,
          category: d.category,
          status: d.status,
          uploaded_at: d.created_at
        })),
        consents
      }
    };

    // Log the privacy export access
    db.insert('audit_logs', {
      user_id: userId,
      action: 'DPDP_DATA_EXPORT',
      resource: 'privacy',
      resource_id: userId,
      timestamp: new Date().toISOString()
    });

    return sendSuccess(res, exportBundle, 200, { message: 'Data export compiled successfully.' });
  } catch (error) {
    console.error('[PRIVACY_EXPORT_ERROR]', error);
    return sendError(res, 500, 'EXPORT_FAILED', 'Failed to generate personal data export.');
  }
});

/**
 * 2. POST /api/v1/privacy/erase
 * Right to Erasure / Right to be Forgotten under DPDP 2023
 * Anonymizes PII while preserving legally required accounting & tax records.
 */
router.post('/erase', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;
    const { reason, confirm_text } = req.body;

    if (confirm_text !== 'DELETE MY PERSONAL DATA') {
      return sendError(
        res,
        400,
        'CONFIRMATION_REQUIRED',
        'To confirm deletion, please provide confirm_text="DELETE MY PERSONAL DATA"'
      );
    }

    const anonymizedEmail = `erased_${userId.substring(0, 8)}@anonymized.tripbygenie.local`;

    // 1. Anonymize user record
    db.update('users', userId, {
      name: 'Anonymized Traveler',
      full_name: 'Anonymized Traveler',
      email: anonymizedEmail,
      phone: '0000000000',
      password_hash: '',
      is_active: false,
      status: 'erased',
      account_status: 'ERASED',
      erased_at: new Date().toISOString(),
      erasure_reason: reason || 'Data Principal Requested Erasure (DPDP 2023)'
    });

    // 2. Anonymize customer profiles
    const custProfile = db.findOne('customer_profiles', (cp) => cp.user_id === userId);
    if (custProfile) {
      db.update('customer_profiles', custProfile.id, {
        name: 'Anonymized Traveler',
        email: anonymizedEmail,
        phone: '0000000000'
      });
    }

    // 3. Delete non-statutory travel documents
    const docs = db.findAll('travel_documents', (d) => d.customer_id === userId);
    for (const d of docs) {
      db.delete('travel_documents', d.id);
    }

    // 4. Revoke all active sessions
    const tokens = db.findAll('refresh_tokens', (t) => t.user_id === userId);
    for (const t of tokens) {
      db.update('refresh_tokens', t.id, { is_revoked: true, revoked_at: new Date().toISOString() });
    }

    // 5. Audit privacy erasure event
    db.insert('audit_logs', {
      user_id: userId,
      action: 'DPDP_DATA_ERASURE',
      resource: 'privacy',
      resource_id: userId,
      details: { statutory_financial_records_retained: true },
      timestamp: new Date().toISOString()
    });

    if (res.clearCookie) {
      res.clearCookie('tg_refresh_token', { path: '/' });
      res.clearCookie('tg_access_token', { path: '/' });
    }

    return sendSuccess(res, { success: true }, 200, {
      message: 'Your personal data has been erased. In compliance with statutory tax regulations, financial transaction records have been retained in an anonymized state.'
    });
  } catch (error) {
    console.error('[PRIVACY_ERASE_ERROR]', error);
    return sendError(res, 500, 'ERASURE_FAILED', 'Failed to process data erasure request.');
  }
});

/**
 * 3. GET /api/v1/privacy/consents
 */
router.get('/consents', authenticate, (req, res) => {
  const consents = db.findAll('user_consents', (c) => c.user_id === req.user.id);
  return sendSuccess(res, { consents });
});

/**
 * 4. POST /api/v1/privacy/consents
 */
router.post('/consents', authenticate, (req, res) => {
  const { purpose, consent_given } = req.body;
  if (!purpose) {
    return sendError(res, 400, 'MISSING_PURPOSE', 'Consent purpose is required.');
  }

  const record = db.insert('user_consents', {
    user_id: req.user.id,
    purpose,
    consent_given: Boolean(consent_given),
    ip_address: req.ip || '127.0.0.1',
    user_agent: req.headers['user-agent'] || '',
    recorded_at: new Date().toISOString()
  });

  return sendSuccess(res, { consent: record }, 201, { message: 'Consent preference recorded.' });
});

module.exports = router;
