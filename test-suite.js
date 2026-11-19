/**
 * Automated Verification & RBAC Security Test Suite
 * Tests all 4 Workflows and the Negative RBAC Matrix against http://localhost:5000/api/v1
 */

const http = require('http');

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
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

async function runTestSuite() {
  console.log('================================================================');
  console.log(' TRIPBYGENIE BACKEND: COMPREHENSIVE AUTOMATED VERIFICATION SUITE');
  console.log('================================================================\n');

  let passedCount = 0;
  let failedCount = 0;

  function assert(testName, condition, detail = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passedCount++;
    } else {
      console.error(`[FAIL] ${testName} - ${detail}`);
      failedCount++;
    }
  }

  try {
    // 1. Health Check
    const healthRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/health',
      method: 'GET'
    });
    assert('Health Check (GET /api/v1/health)', healthRes.status === 200 && healthRes.body.status === 'HEALTHY');

    // 2. Public Landing Data (B2C isolation)
    const landingRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/public/landing-data',
      method: 'GET'
    });
    assert('Public Landing Data (GET /api/v1/public/landing-data)', landingRes.status === 200 && landingRes.body.success === true);
    const pkgs = landingRes.body.data.packages || [];
    const hasWholesaleLeak = pkgs.some(p => p.b2b_offer_price !== undefined);
    assert('Zero B2B Wholesale Leakage in Public Catalog', !hasWholesaleLeak && pkgs.length > 0, 'b2b_offer_price leaked in public response!');
    const samplePackageId = pkgs[0]?.id;

    // 3. Customer Sign-Up + Atomic CRM Lead Creation (Workflow A)
    const testEmail = `traveler_${Date.now()}@example.com`;
    const signupRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/auth/signup',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      full_name: 'Priya Sharma',
      email: testEmail,
      password: 'password123',
      phone: '+919876543210',
      package_id: samplePackageId,
      pax_count: 3,
      notes: 'Planning family holiday in December'
    });
    assert('Customer Signup + Atomic Lead Creation (POST /api/v1/auth/signup)', signupRes.status === 201 && signupRes.body.success === true);
    assert('Customer Assigned User Code (CUS-XXXX)', signupRes.body.data.user.user_code.startsWith('CUS-'));
    assert('Atomic CRM Lead Generated', signupRes.body.data.generated_lead !== null);
    const customerToken = signupRes.body.data.token;
    const generatedLeadId = signupRes.body.data.generated_lead?.id;

    // 4. Admin Authentication
    const adminLoginRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: 'admin@travelgenie.com',
      password: 'Admin@123'
    });
    assert('Admin Login (POST /api/v1/auth/login)', adminLoginRes.status === 200 && adminLoginRes.body.data.user.role === 'ADMIN');
    const adminToken = adminLoginRes.body.data.token;

    // 5. Admin CMS: Package Creation with Dual Pricing
    const newPkgRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/admin/packages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, {
      title: 'Kashmir Autumn Splendor',
      destination: 'Kashmir',
      duration_days: 6,
      duration_nights: 5,
      b2c_price: 45000,
      b2b_offer_price: 34000,
      itinerary_details: [{ day: 1, title: 'Arrival in Srinagar & Dal Lake Shikara ride' }],
      inclusions: ['Hotels', 'Houseboat Stay', 'Breakfast & Dinner', 'Private Cab'],
      exclusions: ['Flight Tickets', 'Personal Expenses']
    });
    assert('Admin Dual-Pricing Package Creation (b2b_offer_price <= b2c_price)', newPkgRes.status === 201 && newPkgRes.body.data.b2b_offer_price === 34000);

    // 5b. Pricing Constraint Check (Reject b2b_offer_price > b2c_price)
    const invalidPkgRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/admin/packages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, {
      title: 'Invalid Pricing Tour',
      destination: 'Goa',
      duration_days: 3,
      duration_nights: 2,
      b2c_price: 15000,
      b2b_offer_price: 22000 // higher than B2C retail
    });
    assert('Admin Rejects b2b_offer_price > b2c_price', invalidPkgRes.status === 400 && invalidPkgRes.body.error.code === 'INVALID_DUAL_PRICING');

    // 6. Admin User Provisioning (STAFF Account)
    const staffEmail = `staff_${Date.now()}@travelgenie.com`;
    const provisionStaffRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/admin/users',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, {
      full_name: 'Rahul Verma',
      email: staffEmail,
      password: 'StaffSecret2026!',
      phone: '+919811122233',
      role: 'STAFF'
    });
    assert('Admin Provisions Staff Account (POST /api/v1/admin/users)', provisionStaffRes.status === 201 && provisionStaffRes.body.data.user_code.startsWith('STF-'));
    const staffId = provisionStaffRes.body.data.id;
    const staffCode = provisionStaffRes.body.data.user_code;

    // 7. Admin Provisions Agent Account
    const agentEmail = `agent_${Date.now()}@b2btravel.com`;
    const provisionAgentRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/admin/users',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, {
      full_name: 'Apex Holidays B2B',
      email: agentEmail,
      password: 'AgentSecret2026!',
      phone: '+919922334455',
      role: 'AGENT'
    });
    assert('Admin Provisions Agent Account (POST /api/v1/admin/users)', provisionAgentRes.status === 201 && provisionAgentRes.body.data.user_code.startsWith('AGT-'));
    const agentId = provisionAgentRes.body.data.id;

    // 8. Admin Assigns Lead to Staff
    if (generatedLeadId) {
      const assignRes = await request({
        hostname: 'localhost',
        port: 5000,
        path: `/api/v1/admin/leads/${generatedLeadId}/assign`,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        }
      }, {
        staff_id: staffId
      });
      assert('Admin Assigns Lead to Staff (PATCH /api/v1/admin/leads/:id/assign)', assignRes.status === 200 && assignRes.body.data.assigned_staff_id === staffId);
    }

    // 9. Staff Login & Queue Access
    const staffLoginRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      identifier: staffEmail,
      password: 'StaffSecret2026!'
    });
    assert('Staff Login (POST /api/v1/auth/login)', staffLoginRes.status === 200 && staffLoginRes.body.data.user.role === 'STAFF');
    const staffToken = staffLoginRes.body.data.token;

    // 10. Staff Queue Isolation (GET /api/v1/staff/leads/my-queue)
    const staffQueueRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/staff/leads/my-queue',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${staffToken}` }
    });
    assert('Staff Fetches Isolated Personal Queue (GET /api/v1/staff/leads/my-queue)', staffQueueRes.status === 200 && Array.isArray(staffQueueRes.body.data));

    // 11. Staff Interaction Logging
    if (generatedLeadId) {
      const interactionRes = await request({
        hostname: 'localhost',
        port: 5000,
        path: `/api/v1/staff/leads/${generatedLeadId}/interactions`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${staffToken}`
        }
      }, {
        channel: 'CALL',
        summary: 'Connected with Priya. Discussed 5-star houseboat upgrade in Dal Lake.'
      });
      assert('Staff Logs Interaction Note (POST /api/v1/staff/leads/:id/interactions)', interactionRes.status === 201 && interactionRes.body.data.channel === 'CALL');

      // 12. Staff Stage Transition to CONTACTED -> QUOTE_SENT -> CONVERTED
      await request({
        hostname: 'localhost',
        port: 5000,
        path: `/api/v1/staff/leads/${generatedLeadId}/stage`,
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${staffToken}` }
      }, { stage: 'CONTACTED' });

      await request({
        hostname: 'localhost',
        port: 5000,
        path: `/api/v1/staff/leads/${generatedLeadId}/stage`,
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${staffToken}` }
      }, { stage: 'QUOTE_SENT', quoted_price: 135000 });

      const convertedRes = await request({
        hostname: 'localhost',
        port: 5000,
        path: `/api/v1/staff/leads/${generatedLeadId}/stage`,
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${staffToken}` }
      }, { stage: 'CONVERTED' });
      assert('Staff State Machine Progression to CONVERTED', convertedRes.status === 200 && convertedRes.body.data.pipeline_stage === 'CONVERTED');

      // 13. Staff Voucher Trigger
      const voucherRes = await request({
        hostname: 'localhost',
        port: 5000,
        path: `/api/v1/staff/leads/${generatedLeadId}/voucher`,
        method: 'POST',
        headers: { 'Authorization': `Bearer ${staffToken}` }
      });
      assert('Staff Generates Travel Voucher on CONVERTED (POST /api/v1/staff/leads/:id/voucher)', voucherRes.status === 200 && voucherRes.body.data.voucher_number.startsWith('VCH-'));
    }

    // 14. Agent Login & Wholesale Catalog (Workflow D)
    const agentLoginRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      identifier: agentEmail,
      password: 'AgentSecret2026!'
    });
    assert('Agent Login (POST /api/v1/auth/login)', agentLoginRes.status === 200 && agentLoginRes.body.data.user.role === 'AGENT');
    const agentToken = agentLoginRes.body.data.token;

    const agentCatalogRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/agent/catalog',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${agentToken}` }
    });
    assert('Agent Wholesale Catalog Exposes Wholesale Rate & Savings', agentCatalogRes.status === 200 && agentCatalogRes.body.data[0].b2b_offer_price !== undefined);

    // 15. Agent Wholesale Resale Order Creation
    const testIdempotencyKey = `IDEMP-${Date.now()}-XYZ`;
    const orderRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/agent/orders',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${agentToken}`
      }
    }, {
      package_id: samplePackageId,
      pax_count: 2,
      traveler_details: [
        { name: 'Kavita Patel', age: 34, gender: 'F' },
        { name: 'Anand Patel', age: 37, gender: 'M' }
      ],
      agent_selling_price: 90000, // Agent sets customer resale price
      idempotency_key: testIdempotencyKey
    });
    assert('Agent Wholesale Order Created with Profit Margin Snapshot', orderRes.status === 201 && orderRes.body.data.agent_profit >= 0);
    const createdOrderId = orderRes.body.data.id;
    const orderNumber = orderRes.body.data.order_number;

    // 16. Idempotency Key Replay Verification
    const replayOrderRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/agent/orders',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${agentToken}`
      }
    }, {
      package_id: samplePackageId,
      pax_count: 2,
      agent_selling_price: 90000,
      idempotency_key: testIdempotencyKey
    });
    assert('Idempotent Replay Prevented Duplicate Order (status 200)', replayOrderRes.status === 200 && replayOrderRes.body.meta.is_idempotent_replay === true);

    // 17. Payment Gateway Webhook
    const webhookRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/agent/orders/webhook',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      event: 'order.payment.captured',
      order_id: createdOrderId,
      order_number: orderNumber,
      payment_reference: 'STRIPE_CH_9948271'
    });
    assert('Payment Webhook Marks Order PAID (POST /api/v1/agent/orders/webhook)', webhookRes.status === 200 && webhookRes.body.data.payment_status === 'PAID');

    // 18. White-Labeled Voucher Download
    const agentVoucherRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/v1/agent/orders/${createdOrderId}/voucher`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${agentToken}` }
    });
    assert('Agent Downloads White-Labeled Client Voucher', agentVoucherRes.status === 200 && agentVoucherRes.body.data.voucher_type === 'WHITE_LABELED_TRAVEL_VOUCHER');

    // =========================================================================
    // 19. RBAC NEGATIVE SECURITY MATRIX TESTS (Must all return 401 or 403)
    // =========================================================================
    console.log('\n--- RBAC NEGATIVE SECURITY MATRIX TESTS ---');

    // A. Unauthenticated Request -> 401 UNAUTHORIZED
    const unauthRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/admin/packages',
      method: 'GET'
    });
    assert('Security Matrix: Unauthenticated Call Blocked (401)', unauthRes.status === 401 && unauthRes.body.error.code === 'UNAUTHORIZED');

    // B. Customer -> Admin CMS Route -> 403 FORBIDDEN_ROLE
    const cusAdminRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/admin/packages',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    assert('Security Matrix: Customer Blocked from Admin CMS (403 FORBIDDEN_ROLE)', cusAdminRes.status === 403 && cusAdminRes.body.error.code === 'FORBIDDEN_ROLE');

    // C. Customer -> Agent Wholesale Catalog -> 403 FORBIDDEN_ROLE
    const cusAgentRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/agent/catalog',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    assert('Security Matrix: Customer Blocked from Wholesale Rates (403 FORBIDDEN_ROLE)', cusAgentRes.status === 403 && cusAgentRes.body.error.code === 'FORBIDDEN_ROLE');

    // D. Staff -> Admin User Provisioning -> 403 FORBIDDEN_ROLE
    const staffProvRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/admin/users',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${staffToken}`
      }
    }, {
      full_name: 'Hacker User',
      email: 'hacker@test.com',
      role: 'ADMIN',
      password: 'password'
    });
    assert('Security Matrix: Staff Blocked from User Provisioning (403 FORBIDDEN_ROLE)', staffProvRes.status === 403 && staffProvRes.body.error.code === 'FORBIDDEN_ROLE');

    // E. Agent -> Staff CRM Pipeline Queue -> 403 FORBIDDEN_ROLE
    const agentQueueRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/staff/leads/my-queue',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${agentToken}` }
    });
    assert('Security Matrix: Agent Blocked from Staff CRM Queue (403 FORBIDDEN_ROLE)', agentQueueRes.status === 403 && agentQueueRes.body.error.code === 'FORBIDDEN_ROLE');

    console.log('\n================================================================');
    console.log(` TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log('================================================================\n');

  } catch (error) {
    console.error('Unhandled test suite error:', error);
  }
}

runTestSuite();
