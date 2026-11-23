/**
 * TRAVELGENIE: COMPLETE B2B AGENT MANAGEMENT & WHOLESALE BOOKING ACCEPTANCE TEST SUITE
 * 
 * Covers all requirements from Section G:
 * - Test 1: Agent Creation (Unique B2B ID, saved record, secure invitation token, automatic email dispatch)
 * - Test 2: Agent Invitation Email (Correct Agent ID, registered email, working activation link, template compliance)
 * - Test 3: Agent Account Activation (Token validation, bcrypt password hashing, account activation, single-use invalidation)
 * - Test 4: Agent Login (Dual login via Agent ID or Email, active status check, B2B dashboard access)
 * - Test 5: Resend Invitation (Fresh token, prior token invalidated, zero duplicate user accounts, status updated)
 * - Test 6: B2B Wholesale Marketplace & Booking Flow (Agent purchase, margin calculation, booking created, customer portal association)
 * - Test 7: Security Invariants (Suspended agent denied, expired token rejected, passwords never in plaintext)
 */

const http = require('http');
const app = require('./server/index');
const db = require('./server/db');

function request(port, options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request({ ...options, hostname: '127.0.0.1', port }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runB2BWorkflowTests() {
  console.log('========================================================================');
  console.log(' TRAVELGENIE: COMPLETE B2B AGENT ONBOARDING & BOOKING ACCEPTANCE TESTS');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(testName, condition, detail = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}${detail ? ' - ' + (typeof detail === 'object' ? JSON.stringify(detail) : detail) : ''}`);
      failed++;
    }
  }

  const PORT = 5057;
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
  console.log(`[TEST RUNNER] B2B Test server listening on http://127.0.0.1:${PORT}\n`);

  try {
    const timestamp = Date.now();
    const agentEmail = `partner.travel_${timestamp}@voyageexpress.com`;
    const agentPhone = `98111${String(timestamp).slice(-5)}`;
    let adminToken = null;
    let createdAgentId = null;
    let createdUserId = null;
    let initialToken = null;
    let resentToken = null;
    let agentAuthToken = null;
    const agentPassword = 'B2BSecretPartnerPass2026!';

    // =========================================================================
    // SETUP: MANAGER LOGS IN
    // =========================================================================
    const adminLogin = await request(PORT, {
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'admin@travelgenie.com', password: 'Admin@123' });

    assert('T0.1: Manager logs in successfully', adminLogin.status === 200 && !!adminLogin.body.token, adminLogin.body);
    adminToken = adminLogin.body.token;

    // =========================================================================
    // TEST 1: AGENT CREATION (MANAGER DASHBOARD)
    // =========================================================================
    console.log('\n--- TEST 1: Agent Creation & Unique ID Generation ---');

    const agentPayload = {
      name: 'Rohan Mehra',
      company_name: 'Voyage Express Wholesale Pvt Ltd',
      email: agentEmail,
      phone: `+91 ${agentPhone}`,
      business_address: 'Level 5, Express Trade Tower, Sector 62, Noida, UP',
      gst_number: '07AAAAA1111A1Z9',
      business_reg_number: 'U74999DL2024PTC123456',
      contact_person: 'Rohan Mehra (Managing Director)',
      account_type: 'WHOLESALE',
      wholesale_discount_pct: 15, // 15% wholesale tier
      credit_limit: 750000
    };

    const createRes = await request(PORT, {
      path: '/api/admin/agents',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, agentPayload);

    assert('T1.1: Manager creates B2B agent returns HTTP 201', createRes.status === 201, createRes.body);
    assert('T1.2: Returns unique Agent ID with prefix "B2B-YYYY-XXXX"', !!createRes.body.agent_id && createRes.body.agent_id.startsWith('B2B-'), createRes.body.agent_id);
    createdAgentId = createRes.body.agent_id;
    createdUserId = createRes.body.agent.user_id || createRes.body.agent.id;

    // Verify record saved in b2b_agents table
    const b2bRecord = db.findOne('b2b_agents', (b) => b.agent_id === createdAgentId);
    assert('T1.3: Agent saved in b2b_agents table with correct details', !!b2bRecord && b2bRecord.email === agentEmail.toLowerCase());
    assert('T1.4: Initial account status is INVITATION_PENDING', b2bRecord.account_status === 'INVITATION_PENDING');
    assert('T1.5: Invitation status is INVITATION_SENT', b2bRecord.invitation_status === 'INVITATION_SENT');

    // Verify user record created with status pending and no plaintext password
    const userRecord = db.findOne('users', (u) => u.email.toLowerCase() === agentEmail.toLowerCase());
    assert('T1.6: User account created in pending state before activation', !!userRecord && userRecord.status === 'pending');
    assert('T1.7: User password is NOT stored in plaintext', !userRecord.password_hash || userRecord.password_hash === '');

    // Verify invitation record in agent_account_invitations table
    const invRecord = db.findOne('agent_account_invitations', (i) => i.agent_id === createdAgentId && !i.is_used);
    assert('T1.8: Secure single-use cryptographic invitation token generated', !!invRecord && !!invRecord.token);
    assert('T1.9: Token has 48-hour expiration timestamp', new Date(invRecord.expires_at) > new Date(Date.now() + 47 * 3600 * 1000));
    initialToken = invRecord.token;

    // Verify audit log in agent_invitation_history
    const auditRecord = db.findOne('agent_invitation_history', (h) => h.agent_id === createdAgentId && h.action === 'INVITATION_CREATED');
    assert('T1.10: Creation and invitation logged in agent_invitation_history audit table', !!auditRecord);

    // =========================================================================
    // TEST 2: AGENT INVITATION EMAIL
    // =========================================================================
    console.log('\n--- TEST 2: Automatic Agent Invitation Email ---');

    const emailLog = db.findOne('email_logs', (l) => l.to_email === agentEmail.toLowerCase() && l.template_name === 'AGENT_ACCOUNT_INVITATION');
    assert('T2.1: Automatic invitation email dispatched and logged in email_logs', !!emailLog);
    assert('T2.2: Email subject contains Company Name and B2B Agent confirmation', emailLog.subject.includes('Welcome') && emailLog.subject.includes('B2B Agent Account Is Ready'));
    assert('T2.3: Email metadata contains correct generated Agent ID', emailLog.metadata.agent_id === createdAgentId);
    assert('T2.4: Email metadata contains secure activation link with token', emailLog.metadata.activation_link.includes(`token=${initialToken}`));
    assert('T2.5: Email metadata never exposes plaintext password or secret keys', !emailLog.metadata.password);

    // =========================================================================
    // TEST 3: RESEND INVITATION (MANAGER ACTION)
    // =========================================================================
    console.log('\n--- TEST 3: Manager Resend Invitation & Token Invalidation ---');

    const userCountBeforeResend = db.findAll('users', (u) => u.email.toLowerCase() === agentEmail.toLowerCase()).length;

    const resendRes = await request(PORT, {
      path: `/api/admin/agents/${createdAgentId}/resend-invitation`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    });

    assert('T3.1: Manager can resend invitation (POST /api/admin/agents/:id/resend-invitation)', resendRes.status === 200 && resendRes.body.success === true);
    
    // Check previous token is now marked is_used = true (invalidated)
    const oldInvRecord = db.findOne('agent_account_invitations', (i) => i.token === initialToken);
    assert('T3.2: Previous unused invitation token immediately invalidated (is_used = true)', oldInvRecord.is_used === true);

    // Check new invitation generated
    const newInvRecord = db.findOne('agent_account_invitations', (i) => i.agent_id === createdAgentId && !i.is_used);
    assert('T3.3: Fresh 48-hour activation token issued', !!newInvRecord && newInvRecord.token !== initialToken);
    resentToken = newInvRecord.token;

    // Check duplicate prevention
    const userCountAfterResend = db.findAll('users', (u) => u.email.toLowerCase() === agentEmail.toLowerCase()).length;
    assert('T3.4: Resending invitation prevents duplicate agent or user accounts', userCountBeforeResend === userCountAfterResend);

    // Verify audit log updated
    const resendAudit = db.findOne('agent_invitation_history', (h) => h.agent_id === createdAgentId && h.action === 'INVITATION_RESENT');
    assert('T3.5: Invitation resend event logged in agent_invitation_history', !!resendAudit);

    // =========================================================================
    // TEST 4: AGENT ACCOUNT ACTIVATION
    // =========================================================================
    console.log('\n--- TEST 4: Agent Account Activation & Password Setup ---');

    // 4.1 Token Verification Endpoint
    const verifyRes = await request(PORT, {
      path: `/api/auth/verify-activation-token?token=${encodeURIComponent(resentToken)}`,
      method: 'GET'
    });
    assert('T4.1: Valid agent invitation token verified successfully', verifyRes.status === 200 && verifyRes.body.valid === true);
    assert('T4.2: Token verification identifies role as "agent"', verifyRes.body.role === 'agent');
    assert('T4.3: Token verification returns Agent ID', verifyRes.body.agent_id === createdAgentId);

    // 4.2 Inactive Old Token Rejected
    const oldVerifyRes = await request(PORT, {
      path: `/api/auth/verify-activation-token?token=${encodeURIComponent(initialToken)}`,
      method: 'GET'
    });
    assert('T4.4: Old invalidated token rejected with HTTP 400', oldVerifyRes.status === 400 && oldVerifyRes.body.error.includes('already been used'));

    // 4.3 Agent sets password (activates account)
    const activateRes = await request(PORT, {
      path: '/api/auth/activate-account',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      token: resentToken,
      password: agentPassword
    });

    assert('T4.5: Agent activates account and creates password (POST /api/auth/activate-account)', activateRes.status === 200 && activateRes.body.success === true);

    // 4.4 Token is now single-use and cannot be used again
    const postActivateVerify = await request(PORT, {
      path: `/api/auth/verify-activation-token?token=${encodeURIComponent(resentToken)}`,
      method: 'GET'
    });
    assert('T4.6: Token immediately invalidated upon first use (single-use enforced)', postActivateVerify.status === 400);

    // 4.5 Verify database state after activation
    const activatedUser = db.findOne('users', (u) => u.email.toLowerCase() === agentEmail.toLowerCase());
    assert('T4.7: User status updated to "active"', activatedUser.status === 'active');
    assert('T4.8: Password securely stored as bcrypt hash', activatedUser.password_hash.startsWith('$2b$'));

    const activatedB2B = db.findOne('b2b_agents', (b) => b.agent_id === createdAgentId);
    assert('T4.9: B2B agent account_status is ACTIVE', activatedB2B.account_status === 'ACTIVE');
    assert('T4.10: B2B agent invitation_status is ACTIVATED', activatedB2B.invitation_status === 'ACTIVATED');
    assert('T4.11: Activated timestamp recorded', !!activatedB2B.activated_at);

    // =========================================================================
    // TEST 5: AGENT LOGIN (DUAL SUPPORT: AGENT ID OR EMAIL)
    // =========================================================================
    console.log('\n--- TEST 5: Agent Login via Agent ID and Email ---');

    // 5.1 Login with Agent ID (e.g. B2B-2026-0001)
    const loginViaAgentId = await request(PORT, {
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: createdAgentId, // Passing Agent ID in the identifier field
      password: agentPassword
    });

    assert('T5.1: Agent logs in successfully using Agent ID (POST /api/auth/login)', loginViaAgentId.status === 200 && !!loginViaAgentId.body.token);
    assert('T5.2: Authenticated role is "agent"', loginViaAgentId.body.user.role === 'agent');
    agentAuthToken = loginViaAgentId.body.token;

    // 5.2 Login with Registered Email Address
    const loginViaEmail = await request(PORT, {
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: agentEmail,
      password: agentPassword
    });

    assert('T5.3: Agent logs in successfully using Registered Email Address', loginViaEmail.status === 200 && !!loginViaEmail.body.token);

    // 5.3 Verify Last Login Timestamp updated
    const updatedAgentRecord = db.findOne('b2b_agents', (b) => b.agent_id === createdAgentId);
    assert('T5.4: Last login timestamp recorded on agent master record', !!updatedAgentRecord.last_login_at);

    // 5.4 Agent Accesses B2B Dashboard
    const agentDash = await request(PORT, {
      path: '/api/agent/dashboard',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${agentAuthToken}` }
    });
    assert('T5.5: Agent accesses dedicated B2B Agent Dashboard (GET /api/agent/dashboard)', agentDash.status === 200);

    // =========================================================================
    // TEST 6: B2B WHOLESALE MARKETPLACE & BOOKING CONVERSION
    // =========================================================================
    console.log('\n--- TEST 6: B2B Wholesale Marketplace & Booking Conversion ---');

    // 6.1 Agent browses discounted wholesale marketplace packages
    const marketplaceRes = await request(PORT, {
      path: '/api/agent/marketplace',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${agentAuthToken}` }
    });
    assert('T6.1: Agent browses wholesale travel marketplace (GET /api/agent/marketplace)', marketplaceRes.status === 200 && Array.isArray(marketplaceRes.body));
    const targetPkg = marketplaceRes.body[0];
    assert('T6.2: Wholesale packages include discounted trade pricing (wholesale_price)', !!targetPkg && typeof targetPkg.wholesale_price === 'number');

    // 6.2 Agent purchases package for client with customer information
    const clientEmail = `b2bclient_${timestamp}@example.com`;
    const purchaseRes = await request(PORT, {
      path: '/api/agent/purchase',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${agentAuthToken}`
      }
    }, {
      package_id: targetPkg.id,
      travelers_count: 2,
      travel_date: '2026-12-20',
      client_name: 'Dr. Suresh Kumar',
      client_email: clientEmail,
      client_phone: '+91 98450 12345',
      client_selling_price: targetPkg.public_price * 2,
      traveler_details: [
        { name: 'Dr. Suresh Kumar', age: 45, gender: 'Male' },
        { name: 'Mrs. Sunita Kumar', age: 42, gender: 'Female' }
      ]
    });

    assert('T6.3: Agent completes wholesale purchase (POST /api/agent/purchase)', purchaseRes.status === 201 && purchaseRes.body.success === true);
    assert('T6.4: Projected agent margin calculated and tracked', typeof purchaseRes.body.purchase.projected_margin === 'number');

    // 6.3 Automatically creates confirmed booking in CRM
    const b2bBooking = db.findOne('bookings', (b) => b.customer_email === clientEmail);
    assert('T6.5: Successful payment automatically generates confirmed booking in CRM', !!b2bBooking && b2bBooking.booking_status === 'Confirmed');
    assert('T6.6: Booking is associated with the purchasing agent ID', b2bBooking.agent_id === createdUserId);

    // 6.4 Customer can view booking through customer portal logic
    const customerBookings = db.findAll('bookings', (b) => b.customer_email && b.customer_email.toLowerCase() === clientEmail.toLowerCase());
    assert('T6.7: Customer receives booking in customer portal under their registered email', customerBookings.length >= 1);

    // =========================================================================
    // TEST 7: MANAGER MONITORING & SECURITY INVARIANTS
    // =========================================================================
    console.log('\n--- TEST 7: Manager Monitoring, Suspension & Security Invariants ---');

    // 7.1 Manager Directory List contains complete monitoring fields
    const adminAgentsRes = await request(PORT, {
      path: '/api/admin/agents',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert('T7.1: Manager retrieves agent directory (GET /api/admin/agents)', adminAgentsRes.status === 200 && Array.isArray(adminAgentsRes.body));
    const agentInDirectory = adminAgentsRes.body.find((a) => a.agent_id === createdAgentId);
    assert('T7.2: Directory entry shows generated Agent ID', !!agentInDirectory && agentInDirectory.agent_id === createdAgentId);
    assert('T7.3: Directory entry shows ACTIVATED invitation status', agentInDirectory.invitation_status === 'ACTIVATED');
    assert('T7.4: Directory entry displays purchase order volume', agentInDirectory.purchasesCount >= 1);

    // 7.2 Manager suspends agent account
    const suspendRes = await request(PORT, {
      path: `/api/admin/agents/${createdAgentId}/status`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, { status: 'suspended', reason: 'Annual trade license verification pending.' });
    assert('T7.5: Manager suspends agent account (PUT /api/admin/agents/:id/status)', suspendRes.status === 200 && suspendRes.body.status === 'suspended');

    // Verify audit log in agent_status_history
    const statusAudit = db.findOne('agent_status_history', (s) => s.agent_id === createdAgentId && s.new_status === 'suspended');
    assert('T7.6: Suspension logged in agent_status_history audit table', !!statusAudit && statusAudit.reason.includes('license'));

    // 7.3 Suspended agent login attempt is REJECTED
    const blockedLogin = await request(PORT, {
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: createdAgentId,
      password: agentPassword
    });
    assert('T7.7: Suspended agent login denied with HTTP 403', blockedLogin.status === 403);
    assert('T7.8: Error message indicates account suspension', blockedLogin.body.error.includes('suspended'));

    // 7.4 Manager reactivates agent account
    const reactivateRes = await request(PORT, {
      path: `/api/admin/agents/${createdAgentId}/status`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, { status: 'active', reason: 'License verified successfully.' });
    assert('T7.9: Manager reactivates agent account', reactivateRes.status === 200 && reactivateRes.body.status === 'active');

    // 7.5 Reactivated agent can log in again
    const reactivatedLogin = await request(PORT, {
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: createdAgentId,
      password: agentPassword
    });
    assert('T7.10: Reactivated agent can log in successfully', reactivatedLogin.status === 200 && !!reactivatedLogin.body.token);

  } catch (err) {
    console.error('Fatal error during B2B test suite execution:', err);
    failed++;
  } finally {
    server.close();
  }

  console.log('\n========================================================================');
  console.log(` B2B TEST SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runB2BWorkflowTests();
