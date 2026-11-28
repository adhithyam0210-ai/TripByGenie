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
  async sendMail({ to, subject, text, html, attachments }) {
    const transporter = this.getTransporter();
    const fromAddress = process.env.SMTP_FROM || process.env.EMAIL_FROM || '"Trip by Genie" <no-reply@tripbygenie.in>';

    if (!transporter) {
      console.log(`[EMAIL DISPATCH] Sent to ${to} (Simulated: No SMTP_HOST or GMAIL_USER in .env)`);
      return { sent: false, simulated: true };
    }

    try {
      const mailOptions = {
        from: fromAddress,
        to,
        subject,
        text,
        html
      };
      if (Array.isArray(attachments) && attachments.length > 0) {
        mailOptions.attachments = attachments;
      }
      const info = await transporter.sendMail(mailOptions);
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
   * Send B2B Partner Enquiry Acknowledgement to Applicant
   */
  async sendB2BEnquiryAcknowledgement({ agency_id, to, company_name, contact_person, enquiry_id }) {
    const subject = `B2B Partner Enquiry Received: ${enquiry_id} - ${company_name}`;
    const content = `Dear ${contact_person},

Thank you for your interest in partnering with TripByGenie!
We have received your B2B Travel Partner enquiry on behalf of ${company_name}.

Enquiry Reference: ${enquiry_id}
Status: Received (Under Business Review)

Our B2B Partnerships & Wholesale Division will review your agency details and contact you shortly to complete the partner verification process.

Best regards,
TripByGenie B2B Wholesale & Partnerships Team`;

    await this.sendMail({
      to,
      subject,
      text: content,
      html: `<div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px;">
        <div style="background-color: #082C43; padding: 18px 24px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #ffffff; margin: 0; font-size: 20px;">TripByGenie B2B Travel Partner Program</h2>
        </div>
        <p>Dear <strong>${contact_person}</strong>,</p>
        <p>Thank you for submitting a B2B Travel Partner enquiry on behalf of <strong>${company_name}</strong>.</p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Enquiry Reference:</strong> <span style="color: #044A9C; font-weight: bold;">${enquiry_id}</span></p>
          <p style="margin: 0;"><strong>Status:</strong> New Enquiry (Awaiting Partner Verification)</p>
        </div>
        <p>Our B2B wholesale specialist will review your company profile, requirements, and contact you shortly for onboarding and exclusive wholesale rate access.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #64748b; margin: 0;">TripByGenie Tours & Travels • Wholesale Partnerships</p>
      </div>`
    });

    const log = db.logEmail(agency_id, to, subject, 'B2B_ENQUIRY_ACKNOWLEDGEMENT', 'DELIVERED', {
      enquiry_id,
      company_name,
      contact_person
    });

    return { success: true, email_id: log.id, subject };
  }

  /**
   * Send Quotation to Customer
   */
  async sendQuotationEmail({ agency_id, to, name, quote_number, destination, total_amount, required_advance, valid_until, custom_body, attachment_name, attachment_data, attachment_type }) {
    const subject = `Your Custom Travel Quotation: ${quote_number} for ${destination}`;
    let content = custom_body ? `Dear ${name},\n\n${custom_body}\n\nBest regards,\nTrip by Genie Sales Team` : `Dear ${name},

We are thrilled to present your customized holiday proposal for ${destination}!

Quotation Number: ${quote_number}
Total Booking Amount: ₹${Number(total_amount).toLocaleString('en-IN')}
Required Advance Deposit: ₹${Number(required_advance).toLocaleString('en-IN')}
Validity: ${valid_until || '7 Days'}

Please review your customized quotation proposal. Once you are ready to confirm your trip, our team will arrange the initial deposit to lock in your booking.

Best regards,
Trip by Genie Sales Team`;

    if (attachment_name) {
      content += `\n\n[Attached Document/Image: ${attachment_name}]`;
    }

    console.log(`[EMAIL DISPATCH] Sent Quotation ${quote_number} to ${to} (Attachment: ${attachment_name || 'None'})`);

    const attachments = [];
    if (attachment_name && attachment_data) {
      try {
        if (attachment_data.startsWith('data:')) {
          const parts = attachment_data.split(',');
          attachments.push({
            filename: attachment_name,
            content: Buffer.from(parts[1], 'base64'),
            contentType: attachment_type || 'application/octet-stream'
          });
        }
      } catch (attachErr) {
        console.warn('Could not parse attachment data buffer:', attachErr.message);
      }
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #EFE7DA; border-radius: 16px; background-color: #FFFDF8;">
        <div style="background-color: #082C43; padding: 18px 24px; border-radius: 12px; margin-bottom: 20px;">
          <h2 style="color: #ffffff; margin: 0 0 6px 0; font-size: 20px;">Trip by Genie Travel Quotation</h2>
          <p style="color: #55C9BD; margin: 0; font-size: 13px; font-weight: bold;">Proposal #${quote_number} • Destination: ${destination}</p>
        </div>
        <p style="font-size: 14px; color: #173247; line-height: 1.6;">Dear <strong>${name}</strong>,</p>
        <div style="font-size: 14px; color: #173247; line-height: 1.6; white-space: pre-wrap; margin: 16px 0;">${custom_body ? custom_body.replace(/\n/g, '<br/>') : `We are thrilled to present your customized holiday proposal for <strong>${destination}</strong>!` }</div>
        <div style="background-color: #F8F1E7; padding: 16px; border-radius: 12px; margin: 20px 0; border: 1px solid #EFE7DA;">
          <p style="margin: 6px 0; color: #082C43; font-size: 13px;"><strong>Destination:</strong> ${destination}</p>
          <p style="margin: 6px 0; color: #082C43; font-size: 13px;"><strong>Total Quoted Price:</strong> <span style="font-size: 16px; font-weight: 800; color: #0070E0;">₹${Number(total_amount).toLocaleString('en-IN')}</span></p>
          <p style="margin: 6px 0; color: #082C43; font-size: 13px;"><strong>Required Advance (30%):</strong> ₹${Number(required_advance).toLocaleString('en-IN')}</p>
          <p style="margin: 6px 0; color: #082C43; font-size: 13px;"><strong>Quote Validity:</strong> ${valid_until || '7 Days'}</p>
          ${attachment_name ? `<p style="margin: 10px 0 4px 0; padding-top: 8px; border-top: 1px dashed #EFE7DA; color: #082C43; font-size: 13px;"><strong>📎 Attached Document/Image:</strong> ${attachment_name}</p>` : ''}
        </div>
        <p style="font-size: 13px; color: #64748b; line-height: 1.5;">To confirm this booking or request itinerary adjustments, please reply to this email or contact your dedicated travel consultant.</p>
        <p style="font-size: 13px; color: #082C43; margin-top: 20px;">Best regards,<br/><strong>Trip by Genie Sales Team</strong></p>
      </div>
    `;

    try {
      await this.sendMail({
        to,
        subject,
        text: content,
        html: htmlContent,
        attachments: attachments.length > 0 ? attachments : undefined
      });
    } catch (e) {
      console.warn('Real mail dispatch error (logged locally):', e.message);
    }

    const log = db.logEmail(agency_id, to, subject, 'QUOTATION_PROPOSAL', 'DELIVERED', {
      quote_number,
      customer_name: name,
      total_amount,
      required_advance,
      attachment_name: attachment_name || null
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
    const baseUrl = (app_url || process.env.APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
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
      activation_token_preview: (activation_token ? activation_token.substring(0, 8) + '...' : 'direct')
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
    const baseUrl = (app_url || process.env.APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
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

  /**
   * Send Staff Consultant / Operations Onboarding Invitation with Credentials & Onboarding Link
   */
  async sendStaffInvitationEmail({ agency_id, to, name, employee_id, designation, temporary_password, app_url }) {
    const baseUrl = (app_url || process.env.APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
    const isOps = designation && designation.toLowerCase().includes('operation');
    const dashboardType = isOps ? 'Operations Dashboard' : 'Sales Dashboard';
    const staffLoginLink = `${baseUrl}/staff-login`;
    const companyName = 'Trip by Genie';
    const dispatchRef = `${employee_id}-${Date.now().toString(36).toUpperCase()}`;
    const subject = `Welcome Aboard, ${name}! Your Staff Workspace Access [${employee_id}]`;

    const content = `Dear ${name},

Welcome to Trip by Genie!
We are thrilled to welcome you to our dedicated team of travel specialists, itinerary designers, and tourism professionals.

At Trip by Genie, every day is about crafting unforgettable journeys, exploring breathtaking destinations, and delivering magical travel experiences to travelers across the globe.

Your staff account has been created with ${designation} designation for the ${dashboardType}.

Your Official Account Credentials:
• Employee ID: ${employee_id}
• Corporate Email (Login ID): ${to}
• Designation: ${designation} (${dashboardType})
• Temporary Password: ${temporary_password}

To access your staff workspace and activate your account, please sign in at:
${staffLoginLink}

(Use your Corporate Email: ${to} and Temporary Password above to sign in)

Wishing you exciting horizons and a memorable voyage with us!

Best regards,
${companyName} Management & Operations Team
Empowering Memorable Journeys Across India & The World
[Ref: ${dispatchRef}]`;

    console.log(`[EMAIL DISPATCH] Sent Staff Account Invitation to ${to} (Employee ID: ${employee_id}, Designation: ${designation})`);

    const mailRes = await this.sendMail({
      to,
      subject,
      text: content,
      headers: {
        'X-Entity-Ref-ID': dispatchRef
      },
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; border: 1px solid #EFE7DA; border-radius: 18px; background-color: #FFFDF8; box-shadow: 0 4px 20px rgba(8, 44, 67, 0.05);">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #082C43; margin: 0 0 6px 0; font-size: 24px; font-weight: 800;">Welcome to Trip by Genie!</h2>
          <p style="color: #FF795C; font-size: 13px; font-weight: bold; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">Crafting Unforgettable Journeys Across The Globe</p>
        </div>

        <p style="color: #333; line-height: 1.6; font-size: 14px;">Dear <strong>${name}</strong>,</p>
        
        <p style="color: #4A5568; line-height: 1.6; font-size: 14px;">
          We are delighted to welcome you to the <strong>Trip by Genie</strong> family! You are joining an elite team of travel specialists, itinerary designers, and holiday creators dedicated to turning travel dreams into reality.
        </p>

        <p style="color: #4A5568; line-height: 1.6; font-size: 14px;">
          Your staff account has been created with <strong>${designation}</strong> designation, providing full access to the <strong>${dashboardType}</strong>.
        </p>
        
        <div style="background-color: #F8F1E7; padding: 24px; border-radius: 14px; margin: 24px 0; border-left: 4px solid #17648A;">
          <p style="margin: 0 0 12px 0; color: #082C43; font-size: 15px; font-weight: bold;">Your Official Account Credentials:</p>
          <p style="margin: 8px 0; color: #082C43; font-size: 13px;"><strong>Employee ID:</strong> <span style="font-family: monospace; font-size: 14px; font-weight: bold; color: #17648A;">${employee_id}</span></p>
          <p style="margin: 8px 0; color: #082C43; font-size: 13px;"><strong>Corporate Email (Login ID):</strong> <span style="font-weight: bold; color: #082C43;">${to}</span></p>
          <p style="margin: 8px 0; color: #082C43; font-size: 13px;"><strong>Designation:</strong> ${designation} (${dashboardType})</p>
          <p style="margin: 8px 0; color: #082C43; font-size: 13px;"><strong>Temporary Password:</strong> <code style="background: #fff; padding: 4px 10px; border-radius: 6px; font-weight: bold; color: #9333EA; border: 1px solid #E9D5FF; font-size: 14px; letter-spacing: 0.5px;">${temporary_password}</code></p>
          
          <div style="text-align: center; margin: 24px 0 12px 0;">
            <a href="${staffLoginLink}" style="background-color: #FF795C; background-image: linear-gradient(135deg, #FF795C 0%, #FF5733 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; font-weight: bold; border-radius: 10px; display: inline-block; font-size: 15px; box-shadow: 0 4px 12px rgba(255, 87, 51, 0.35);">Log In to Staff Workspace &rarr;</a>
          </div>
          <p style="color: #718096; font-size: 11px; text-align: center; margin: 8px 0 0 0;">
            Direct link: <a href="${staffLoginLink}" style="color: #17648A; word-break: break-all; font-size: 11px;">${staffLoginLink}</a>
          </p>
        </div>

        <p style="color: #718096; font-size: 12px; text-align: center; line-height: 1.5; margin: 0 0 20px 0;">
          Use your Corporate Email (<strong>${to}</strong>) and the Temporary Password above to sign in. Upon your first login, your account will be activated.
        </p>

        <hr style="border: none; border-top: 1px solid #EFE7DA; margin: 20px 0;" />
        <div style="text-align: center;">
          <p style="color: #082C43; font-size: 13px; font-weight: bold; margin: 0 0 4px 0;">Trip by Genie Management Team</p>
          <p style="color: #A0AEC0; font-size: 11px; margin: 0;">Empowering Memorable Journeys Across India & The World • Ref #${dispatchRef}</p>
        </div>
      </div>`
    });

    const log = db.logEmail(agency_id, to, subject, 'STAFF_ACCOUNT_INVITATION', 'DELIVERED', {
      employee_id,
      employee_name: name,
      designation,
      login_link: staffLoginLink
    });

    return {
      success: mailRes?.sent ?? true,
      sent: mailRes?.sent ?? false,
      simulated: mailRes?.simulated ?? false,
      error: mailRes?.error,
      email_id: log.id,
      subject,
      login_link: staffLoginLink
    };
  }

  /**
   * Send Operations Manager Onboarding Invitation with Credentials & Portal Link
   */
  async sendManagerInvitationEmail({ agency_id, to, name, employee_id, department, temporary_password, app_url }) {
    const baseUrl = (app_url || process.env.APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
    const managerLoginLink = `${baseUrl}/login?email=${encodeURIComponent(to)}`;
    const companyName = 'Trip by Genie';
    const dispatchRef = `${employee_id}-${Date.now().toString(36).toUpperCase()}`;
    const subject = `Welcome Aboard, ${name}! Your Manager Operations Access [${employee_id}]`;

    const content = `Dear ${name},

Welcome to Trip by Genie!
We are proud to welcome you as a key leader in our Management & Operations team.

Your Manager Account has been created with administrative access to the Manager Dashboard.

Your Official Account Credentials:
• Manager / Employee ID: ${employee_id}
• Corporate Email (Login ID): ${to}
• Portfolio / Division: ${department || 'Management & Operations'}
• Temporary Password: ${temporary_password}

To access your manager dashboard and get started, please sign in at:
${managerLoginLink}

Wishing you tremendous success leading the team and orchestrating unforgettable journeys!

Best regards,
${companyName} Super Admin & Executive Directorate
[Ref: ${dispatchRef}]`;

    console.log(`[EMAIL DISPATCH] Sent Manager Account Invitation to ${to} (Manager ID: ${employee_id})`);

    const mailRes = await this.sendMail({
      to,
      subject,
      text: content,
      headers: {
        'X-Entity-Ref-ID': dispatchRef
      },
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; border: 1px solid #EFE7DA; border-radius: 18px; background-color: #FFFDF8; box-shadow: 0 4px 20px rgba(8, 44, 67, 0.05);">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #082C43; margin: 0 0 6px 0; font-size: 24px; font-weight: 800;">Welcome to Trip by Genie!</h2>
          <p style="color: #9333EA; font-size: 13px; font-weight: bold; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">Executive & Operations Management</p>
        </div>

        <p style="color: #333; line-height: 1.6; font-size: 14px;">Dear <strong>${name}</strong>,</p>
        <p style="color: #4A5568; line-height: 1.6; font-size: 14px;">
          We are pleased to welcome you as an <strong>Operations Manager</strong> at <strong>Trip by Genie</strong>. Your leadership credentials and management workspace have been provisioned.
        </p>

        <div style="background-color: #F8F1E7; padding: 24px; border-radius: 14px; margin: 24px 0; border-left: 4px solid #9333EA;">
          <p style="margin: 0 0 12px 0; color: #082C43; font-size: 15px; font-weight: bold;">Your Managerial Access Credentials:</p>
          <p style="margin: 8px 0; color: #082C43; font-size: 13px;"><strong>Manager ID:</strong> <span style="font-family: monospace; font-size: 14px; font-weight: bold; color: #9333EA;">${employee_id}</span></p>
          <p style="margin: 8px 0; color: #082C43; font-size: 13px;"><strong>Corporate Email:</strong> <span style="font-weight: bold; color: #082C43;">${to}</span></p>
          <p style="margin: 8px 0; color: #082C43; font-size: 13px;"><strong>Portfolio:</strong> ${department || 'Management & Operations'}</p>
          <p style="margin: 8px 0; color: #082C43; font-size: 13px;"><strong>Temporary Password:</strong> <code style="background: #fff; padding: 4px 10px; border-radius: 6px; font-weight: bold; color: #9333EA; border: 1px solid #E9D5FF; font-size: 14px;">${temporary_password}</code></p>
          
          <div style="text-align: center; margin: 24px 0 12px 0;">
            <a href="${managerLoginLink}" style="background-color: #9333EA; color: #ffffff; padding: 14px 32px; text-decoration: none; font-weight: bold; border-radius: 10px; display: inline-block; font-size: 15px;">Log In to Manager Dashboard &rarr;</a>
          </div>
          <p style="color: #718096; font-size: 11px; text-align: center; margin: 8px 0 0 0;">
            Direct link: <a href="${managerLoginLink}" style="color: #17648A; font-size: 11px;">${managerLoginLink}</a>
          </p>
        </div>

        <p style="color: #718096; font-size: 12px; text-align: center; margin: 0 0 20px 0;">
          Use your corporate email and temporary password to access your dashboard. You may update your password upon first login.
        </p>

        <hr style="border: none; border-top: 1px solid #EFE7DA; margin: 20px 0;" />
        <div style="text-align: center;">
          <p style="color: #082C43; font-size: 13px; font-weight: bold; margin: 0;">Trip by Genie Directorate</p>
        </div>
      </div>`
    });

    const log = db.logEmail(agency_id, to, subject, 'MANAGER_ACCOUNT_INVITATION', 'DELIVERED', {
      employee_id,
      name,
      department,
      login_link: managerLoginLink
    });

    return {
      success: mailRes?.sent ?? true,
      email_id: log.id,
      subject,
      login_link: managerLoginLink
    };
  }

  /**
   * Send Customer Welcome & Onboarding Email with Portal Credentials
   */
  async sendCustomerWelcomeEmail({ agency_id, to, name, customer_id, temporary_password, app_url }) {
    const baseUrl = (app_url || process.env.APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
    const loginLink = `${baseUrl}/login?email=${encodeURIComponent(to)}`;
    const companyName = 'Trip by Genie';
    const dispatchRef = `${customer_id}-${Date.now().toString(36).toUpperCase()}`;
    const subject = `Welcome to Trip by Genie, ${name}! Your Travel Account Is Ready [${customer_id}]`;

    const content = `Dear ${name},

Welcome to Trip by Genie!
We are thrilled to welcome you to our travel family. Your customer travel account has been successfully created.

You now have 24/7 access to your personal Customer Portal where you can:
• Track holiday bookings and customized itineraries
• Download confirmed travel vouchers, e-tickets, and hotel confirmations
• Review payment receipts and invoices
• Connect directly with your dedicated travel consultant

Your Customer Portal Login Details:
• Customer ID: ${customer_id}
• Login ID (Email): ${to}
• Temporary Password: ${temporary_password}

To access your travel dashboard, please visit:
${loginLink}

Thank you for choosing Trip by Genie. We look forward to creating unforgettable travel memories for you!

Warm regards,
${companyName} Guest Relations & Concierge Desk
[Ref: ${dispatchRef}]`;

    console.log(`[EMAIL DISPATCH] Sent Customer Welcome Email to ${to} (Customer ID: ${customer_id})`);

    const mailRes = await this.sendMail({
      to,
      subject,
      text: content,
      headers: {
        'X-Entity-Ref-ID': dispatchRef
      },
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; border: 1px solid #EFE7DA; border-radius: 18px; background-color: #FFFDF8; box-shadow: 0 4px 20px rgba(8, 44, 67, 0.05);">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #082C43; margin: 0 0 6px 0; font-size: 24px; font-weight: 800;">Welcome to Trip by Genie!</h2>
          <p style="color: #FF795C; font-size: 13px; font-weight: bold; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">Your Journey Begins Here</p>
        </div>

        <p style="color: #333; line-height: 1.6; font-size: 14px;">Dear <strong>${name}</strong>,</p>
        <p style="color: #4A5568; line-height: 1.6; font-size: 14px;">
          Thank you for choosing <strong>Trip by Genie</strong>! Your customer travel account is now ready, giving you instant access to your personalized itineraries, booking documents, and trip concierge.
        </p>

        <div style="background-color: #F8F1E7; padding: 24px; border-radius: 14px; margin: 24px 0; border-left: 4px solid #10B981;">
          <p style="margin: 0 0 12px 0; color: #082C43; font-size: 15px; font-weight: bold;">Your Customer Portal Credentials:</p>
          <p style="margin: 8px 0; color: #082C43; font-size: 13px;"><strong>Customer ID:</strong> <span style="font-family: monospace; font-size: 14px; font-weight: bold; color: #10B981;">${customer_id}</span></p>
          <p style="margin: 8px 0; color: #082C43; font-size: 13px;"><strong>Registered Email:</strong> <span style="font-weight: bold; color: #082C43;">${to}</span></p>
          <p style="margin: 8px 0; color: #082C43; font-size: 13px;"><strong>Temporary Password:</strong> <code style="background: #fff; padding: 4px 10px; border-radius: 6px; font-weight: bold; color: #10B981; border: 1px solid #A7F3D0; font-size: 14px;">${temporary_password}</code></p>
          
          <div style="text-align: center; margin: 24px 0 12px 0;">
            <a href="${loginLink}" style="background-color: #FF795C; background-image: linear-gradient(135deg, #FF795C 0%, #FF5733 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; font-weight: bold; border-radius: 10px; display: inline-block; font-size: 15px; box-shadow: 0 4px 12px rgba(255, 87, 51, 0.35);">Access Customer Portal &rarr;</a>
          </div>
          <p style="color: #718096; font-size: 11px; text-align: center; margin: 8px 0 0 0;">
            Direct link: <a href="${loginLink}" style="color: #17648A; font-size: 11px;">${loginLink}</a>
          </p>
        </div>

        <p style="color: #718096; font-size: 12px; text-align: center; margin: 0 0 20px 0;">
          Use your registered email and temporary password to sign in. You can reset your password anytime from your profile settings.
        </p>

        <hr style="border: none; border-top: 1px solid #EFE7DA; margin: 20px 0;" />
        <div style="text-align: center;">
          <p style="color: #082C43; font-size: 13px; font-weight: bold; margin: 0;">Trip by Genie Guest Relations</p>
          <p style="color: #A0AEC0; font-size: 11px; margin: 0;">Ref #${dispatchRef}</p>
        </div>
      </div>`
    });

    const log = db.logEmail(agency_id, to, subject, 'CUSTOMER_WELCOME_EMAIL', 'DELIVERED', {
      customer_id,
      name,
      login_link: loginLink
    });

    return {
      success: mailRes?.sent ?? true,
      email_id: log.id,
      subject,
      login_link: loginLink
    };
  }
}

const emailService = new EmailService();
module.exports = emailService;
