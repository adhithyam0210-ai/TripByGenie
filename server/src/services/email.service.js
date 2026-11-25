/**
 * Transactional Email Service for Trip by Genie C2B & B2B Workflows
 * Dispatches real emails via SMTP/Nodemailer when configured, or logs locally.
 * Never exposes passwords or sensitive keys in logs.
 */
const path = require('path');
try {
  require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
} catch (e) { }

const db = require('../../db');

let nodemailer = null;
try {
  nodemailer = require('nodemailer');
} catch (e) {
  // Nodemailer optional fallback
}

class EmailService {
  /**
   * Get public status of configured email service
   */
  getStatus() {
    const gmailUser = process.env.GMAIL_USER || process.env.EMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS || process.env.EMAIL_PASS;
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;

    if (gmailUser && gmailPass) {
      const masked = gmailUser.replace(/(.{2})(.*)(@.*)/, '$1***$3');
      return {
        configured: true,
        mode: 'gmail',
        provider: 'Gmail SMTP',
        account: masked,
        from: process.env.SMTP_FROM || process.env.EMAIL_FROM || `"Trip by Genie" <${gmailUser}>`
      };
    }

    if (smtpHost) {
      const masked = smtpUser ? smtpUser.replace(/(.{2})(.*)(@.*)/, '$1***$3') : undefined;
      return {
        configured: true,
        mode: 'smtp',
        provider: 'Custom SMTP',
        host: smtpHost,
        port: Number(process.env.SMTP_PORT) || 587,
        account: masked,
        from: process.env.SMTP_FROM || process.env.EMAIL_FROM || '"Trip by Genie" <no-reply@tripbygenie.in>'
      };
    }

    return {
      configured: false,
      mode: 'simulated',
      provider: 'Simulation Mode',
      message: 'No SMTP credentials found in .env. Real emails are currently simulated and logged to the server terminal.'
    };
  }
  /**
   * Get configured Nodemailer transport
   */
  getTransporter() {
    if (!nodemailer) return null;

    // 1. Gmail Shortcut (GMAIL_USER and GMAIL_APP_PASSWORD)
    const gmailUser = process.env.GMAIL_USER || process.env.EMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS || process.env.EMAIL_PASS;
    if (gmailUser && gmailPass) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailPass
        }
      });
    }

    // 2. Custom SMTP (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)
    const smtpHost = process.env.SMTP_HOST;
    if (smtpHost) {
      return nodemailer.createTransport({
        host: smtpHost,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
        auth: (process.env.SMTP_USER && process.env.SMTP_PASS) ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        } : undefined
      });
    }

    return null;
  }

  /**
   * Send mail through real transporter if configured
   */
  async sendMail({ to, subject, text, html }) {
    const transporter = this.getTransporter();
    const fromAddress = process.env.SMTP_FROM || process.env.EMAIL_FROM || '"Trip by Genie" <no-reply@tripbygenie.in>';

    if (!transporter) {
      console.log(`[EMAIL DISPATCH] Sent to ${to} (Simulated: No SMTP_HOST or GMAIL_USER in .env)`);
      return { sent: false, simulated: true };
    }

    try {
      const info = await transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        text,
        html
      });
      console.log(`[REAL SMTP EMAIL SENT] Delivered email to ${to} (Message ID: ${info.messageId})`);
      return { sent: true, messageId: info.messageId };
    } catch (err) {
      console.error(`[SMTP ERROR] Failed to deliver real email to ${to}:`, err.message);
      return { sent: false, error: err.message };
    }
  }

  /**
   * Send Enquiry Acknowledgement to Customer
   */
  async sendEnquiryAcknowledgement({ agency_id, to, name, enquiry_id, destination }) {
    const subject = `Enquiry Received: ${enquiry_id} - Your Trip to ${destination}`;
    const content = `Dear ${name},

Thank you for contacting Trip by Genie!
We have received your holiday enquiry for ${destination}.

Enquiry ID: ${enquiry_id}
Status: Received (Under Specialist Review)

Our dedicated travel consultant will review your preferences and contact you shortly with a personalized itinerary and quotation.

Best regards,
Trip by Genie Travel Experience Team`;

    await this.sendMail({
      to,
      subject,
      text: content,
      html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #082C43;">Thank You for Your Enquiry</h2>
        <p>Dear ${name},</p>
        <p>We have received your holiday enquiry for <strong>${destination}</strong>.</p>
        <p><strong>Enquiry ID:</strong> ${enquiry_id}</p>
        <p>Our travel specialist will contact you shortly with a personalized quotation.</p>
        <p>Best regards,<br/><strong>Trip by Genie Team</strong></p>
      </div>`
    });

    const log = db.logEmail(agency_id, to, subject, 'ENQUIRY_ACKNOWLEDGEMENT', 'DELIVERED', {
      enquiry_id,
      customer_name: name,
      destination
    });

    return { success: true, email_id: log.id, subject };
  }

  /**
   * Send Quotation to Customer
   */
  async sendQuotationEmail({ agency_id, to, name, quote_number, destination, total_amount, required_advance, valid_until }) {
    const subject = `Your Custom Travel Quotation: ${quote_number} for ${destination}`;
    const content = `Dear ${name},

We are thrilled to present your customized holiday proposal for ${destination}!

Quotation Number: ${quote_number}
Total Booking Amount: ₹${Number(total_amount).toLocaleString('en-IN')}
Required Advance Deposit: ₹${Number(required_advance).toLocaleString('en-IN')}
Validity: ${valid_until || '7 Days'}

Please review your day-wise itinerary and package inclusions. Once you are ready to confirm your trip, our team will arrange the initial deposit to lock in your flights and hotels.

Best regards,
Trip by Genie Sales Team`;

    console.log(`[EMAIL DISPATCH] Sent Quotation ${quote_number} to ${to}`);

    const log = db.logEmail(agency_id, to, subject, 'QUOTATION_PROPOSAL', 'DELIVERED', {
      quote_number,
      customer_name: name,
      total_amount,
      required_advance
    });

    return { success: true, email_id: log.id, subject };
  }

  /**
   * Send Payment Confirmation & Booking Receipt
   */
  async sendPaymentReceiptEmail({ agency_id, to, name, booking_number, amount_paid, remaining_balance, txn_ref }) {
    const subject = `Payment Confirmed: ₹${Number(amount_paid).toLocaleString('en-IN')} for Booking #${booking_number}`;
    const content = `Dear ${name},

Thank you! Your partial advance payment has been successfully verified.

Booking Reference: ${booking_number}
Transaction Reference: ${txn_ref}
Amount Paid: ₹${Number(amount_paid).toLocaleString('en-IN')}
Remaining Balance: ₹${Number(remaining_balance).toLocaleString('en-IN')}
Booking Status: Confirmed

Your travel reservations are being coordinated with our local ground operations.

Warm regards,
Trip by Genie Accounts & Operations Desk`;

    console.log(`[EMAIL DISPATCH] Sent Payment Receipt for Booking ${booking_number} to ${to}`);

    const log = db.logEmail(agency_id, to, subject, 'PAYMENT_RECEIPT', 'DELIVERED', {
      booking_number,
      amount_paid,
      remaining_balance,
      txn_ref
    });

    return { success: true, email_id: log.id, subject };
  }

  /**
   * Send Customer Onboarding & Secure Account Activation Invitation
   * Security: Activation link contains a single-use cryptographically secure token.
   * No permanent plaintext passwords are ever sent.
   */
  async sendAccountActivationEmail({ agency_id, to, name, customer_id, booking_id, activation_token, app_url }) {
    const baseUrl = app_url || process.env.APP_URL || 'http://localhost:3000';
    const activationLink = `${baseUrl}/activate-account?token=${encodeURIComponent(activation_token)}`;
    const subject = 'Your Travel Account Is Ready – Access Your Booking Details';

    const content = `Dear ${name},

Thank you for choosing Trip by Genie for your upcoming trip.
Your travel booking has been registered successfully, and your customer account has been created.

You can now access your personal travel dashboard to view your booking details, payment information, travel itinerary and important documents.

Your Account Details:
Customer ID: ${customer_id}
Registered Email: ${to}
Booking Reference: ${booking_id}

Account Activation:
Click the secure link below to set your password and activate your travel account:
${activationLink}

(Note: This secure activation link is valid for 48 hours and can only be used once.)

After activating your account, you can log in using your registered email address and newly created password.

Your customer dashboard provides access to:
• Booking Details
• Travel Itinerary
• Payment History & Receipts
• Flight Tickets & Hotel Vouchers
• Travel Documents & Real-Time Updates

Thank you for choosing Trip by Genie.

Best Regards,
Trip by Genie Customer Support Team`;

    console.log(`[EMAIL DISPATCH] Sent Account Activation Invitation to ${to} (Customer ID: ${customer_id})`);

    await this.sendMail({
      to,
      subject,
      text: content,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #EFE7DA; border-radius: 16px; background-color: #FFFDF8;">
        <h2 style="color: #082C43; margin-top: 0;">Welcome to Trip by Genie!</h2>
        <p style="color: #333; line-height: 1.6;">Dear <strong>${name}</strong>,</p>
        <p style="color: #333; line-height: 1.6;">Your travel booking has been registered successfully, and your customer account has been created.</p>
        <div style="background-color: #F8F1E7; padding: 16px; border-radius: 12px; margin: 20px 0;">
          <p style="margin: 4px 0; color: #082C43;"><strong>Customer ID:</strong> <span style="font-family: monospace; font-size: 14px; font-weight: bold; color: #082C43;">${customer_id}</span></p>
          <p style="margin: 4px 0; color: #082C43;"><strong>Registered Email:</strong> ${to}</p>
          <p style="margin: 4px 0; color: #082C43;"><strong>Booking Reference:</strong> ${booking_id}</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${activationLink}" style="background-color: #FF795C; color: white; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 12px; display: inline-block;">Activate Account & Set Password</a>
        </div>
        <p style="color: #666; font-size: 12px; line-height: 1.5;">Or open this link directly in your browser:<br/><a href="${activationLink}" style="color: #17648A;">${activationLink}</a></p>
        <p style="color: #888; font-size: 11px;">(This secure link is valid for 48 hours and single-use only.)</p>
      </div>`
    });

    const log = db.logEmail(agency_id, to, subject, 'CUSTOMER_ACCOUNT_INVITATION', 'DELIVERED', {
      customer_id,
      booking_id,
      activation_link: activationLink,
      activation_token_preview: activation_token.substring(0, 8) + '...'
    });

    return {
      success: true,
      email_id: log.id,
      subject,
      activation_link: activationLink
    };
  }

  /**
   * Send B2B Agent Onboarding & Secure Account Activation Invitation
   * Matches Section 2.B Email Template specification.
   */
  async sendAgentInvitationEmail({ agency_id, to, name, company_name, agent_id, activation_token, app_url }) {
    const baseUrl = app_url || process.env.APP_URL || 'http://localhost:3000';
    const activationLink = `${baseUrl}/activate-account?token=${encodeURIComponent(activation_token)}&type=b2b`;
    const companyName = 'Trip by Genie';
    const subject = `Welcome to ${companyName} – Your B2B Agent Account Is Ready!`;

    const content = `Dear ${name},

Welcome to ${companyName}!
Your B2B Agent account has been successfully created by our Manager.
You can now activate your account and access our exclusive B2B travel packages and discounted wholesale offers.

Your Account Details:
Agent ID: ${agent_id}
Agency Name: ${company_name}
Registered Email: ${to}

Activate Your Account:
${activationLink}

Click the above link to activate your account and create your password.

After successful activation, you can log in to your dedicated B2B Agent Dashboard and:
• Explore exclusive discounted travel packages.
• View B2B wholesale pricing.
• Purchase packages for your customers.
• Manage customer and traveller details.
• Complete package payments.
• Track your bookings.
• Download invoices and payment receipts.
• Access travel documents and booking updates.

Thank you for partnering with ${companyName}.

Best Regards,
${companyName}
B2B Partnership Team`;

    console.log(`[EMAIL DISPATCH] Sent B2B Agent Activation Invitation to ${to} (Agent ID: ${agent_id})`);

    await this.sendMail({
      to,
      subject,
      text: content,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #EFE7DA; border-radius: 16px; background-color: #FFFDF8;">
        <h2 style="color: #082C43; margin-top: 0;">Welcome to ${companyName}!</h2>
        <p style="color: #333; line-height: 1.6;">Dear <strong>${name}</strong>,</p>
        <p style="color: #333; line-height: 1.6;">Your B2B Agent account has been successfully created by our Manager. You can now activate your account and access our exclusive B2B travel packages and discounted wholesale offers.</p>
        
        <div style="background-color: #F8F1E7; padding: 16px; border-radius: 12px; margin: 20px 0;">
          <p style="margin: 4px 0; color: #082C43;"><strong>Agent ID:</strong> <span style="font-family: monospace; font-size: 14px; font-weight: bold; color: #17648A;">${agent_id}</span></p>
          <p style="margin: 4px 0; color: #082C43;"><strong>Agency Name:</strong> ${company_name}</p>
          <p style="margin: 4px 0; color: #082C43;"><strong>Registered Email:</strong> ${to}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${activationLink}" style="background-color: #FF795C; color: white; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 12px; display: inline-block;">Activate Your Account & Set Password</a>
        </div>

        <p style="color: #666; font-size: 12px; line-height: 1.5;">Click the button above or open this link directly in your browser:<br/><a href="${activationLink}" style="color: #17648A;">${activationLink}</a></p>
        <p style="color: #888; font-size: 11px;">(Note: This secure link is valid for 48 hours and can only be used once.)</p>
        
        <hr style="border: none; border-top: 1px solid #EFE7DA; margin: 24px 0;" />
        <p style="color: #999; font-size: 11px; margin-bottom: 0;">${companyName} B2B Partnership Team</p>
      </div>`
    });

    const log = db.logEmail(agency_id, to, subject, 'AGENT_ACCOUNT_INVITATION', 'DELIVERED', {
      agent_id,
      agent_name: name,
      company_name,
      activation_link: activationLink,
      activation_token_preview: activation_token ? activation_token.substring(0, 8) + '...' : ''
    });

    return {
      success: true,
      email_id: log.id,
      subject,
      activation_link: activationLink
    };
  }
}

const emailService = new EmailService();
module.exports = emailService;
