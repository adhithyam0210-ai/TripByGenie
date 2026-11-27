/**
 * TripByGenie: Enterprise B2C Lead Management & Booking Conversion Full Lifecycle Test Suite
 * Validates End-to-End Workflow across Customer, Staff, and Manager with Strict RBAC,
 * Department Validation, Status Transitions, Payment Verification, and Customer Onboarding.
 */

const http = require('http');
const app = require('./server/index');

function request(port, options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request({ ...options, hostname: '127.0.0.1', port }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data, headers: res.headers });
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

async function runB2CLifecycleTests() {
  console.log('========================================================================');
  console.log(' TRIPBYGENIE: COMPLETE B2C LEAD MANAGEMENT & CONVERSION ACCEPTANCE TESTS');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(testName, condition, detail = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${detail}`);
      failed++;
    }
  }

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const PORT = server.address().port;
  console.log(`[TEST RUNNER] B2C Test server listening on http://127.0.0.1:${PORT}\n`);

  try {
    // -------------------------------------------------------------------------
    // SETUP: Authenticate Manager, Sales Staff, and Other Staff
    // -------------------------------------------------------------------------
    console.log('--- SETUP: Actor Authentication ---');
    
    // Manager login
    const mgrRes = await request(PORT, {
      path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: 'admin@travelgenie.com',
      password: 'Admin@123'
    });
    assert('Setup: Manager logs in successfully', mgrRes.status === 200 && !!mgrRes.body.token);
    const managerToken = mgrRes.body.token;

    // Staff Priya Nair (International & Honeymoon Specialist)
    const priyaRes = await request(PORT, {
      path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: 'priya.staff@travelgenie.com',
      password: 'Staff@123'
    });
    assert('Setup: Sales Staff Priya logs in successfully', priyaRes.status === 200 && !!priyaRes.body.token);
    const priyaToken = priyaRes.body.token;
    const priyaId = priyaRes.body.user.id;

    // Staff Rahul Verma (Domestic & Group Tours)
    const rahulRes = await request(PORT, {
      path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: 'rahul.staff@travelgenie.com',
      password: 'Staff@123'
    });
    assert('Setup: Sales Staff Rahul logs in successfully', rahulRes.status === 200 && !!rahulRes.body.token);
    const rahulToken = rahulRes.body.token;
    const rahulId = rahulRes.body.user.id;

    // Operations Staff Karthik ID
    const opsId = 'usr_operations_karthik';

    // -------------------------------------------------------------------------
    // STAGE 1: Public Enquiry Submission
    // -------------------------------------------------------------------------
    console.log('\n--- STAGE 1: Customer Enquiry & Lead Creation ---');
    const timestamp = Date.now();
    const customerEmail = `traveler.test_${timestamp}@gmail.com`;

    const enquiryRes = await request(PORT, {
      path: '/api/public/enquiry', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      name: 'Rohan_Mehta',
      email: customerEmail,
      phone: '+91 9876501234',
      destination: 'Switzerland & Paris Honeymoon',
      departure_city: 'Mumbai',
      travel_date: '2026-12-15',
      travelers_count: 2,
      budget: '₹2,50,000 - ₹3,50,000',
      travel_type: 'Honeymoon',
      special_requirements: 'Window seats on train and mountain view suite',
      source: 'Universal Landing Page'
    });

    assert('1.1: Customer submits enquiry form successfully (HTTP 201)', enquiryRes.status === 201 && enquiryRes.body.success === true);
    assert('1.2: Returns unique Lead ID and Enquiry ID', !!enquiryRes.body.lead_id && !!enquiryRes.body.enquiry_id);
    const leadId = enquiryRes.body.lead_id;

    // Idempotency: Duplicate submission within 30s detected
    const dupRes = await request(PORT, {
      path: '/api/public/enquiry', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      name: 'Rohan_Mehta',
      email: customerEmail,
      phone: '+91 9876501234',
      destination: 'Switzerland & Paris Honeymoon'
    });
    assert('1.3: Duplicate submission within 30s handled safely with existing lead', dupRes.status === 201 && dupRes.body.duplicate === true && dupRes.body.lead_id === leadId);

    // -------------------------------------------------------------------------
    // STAGE 2: Manager Lead Inspection & Department-based Assignment
    // -------------------------------------------------------------------------
    console.log('\n--- STAGE 2: Manager Lead Management & Department Assignment ---');

    // Manager views lead
    const mgrLeadRes = await request(PORT, {
      path: `/api/admin/leads/${leadId}`, method: 'GET',
      headers: { 'Authorization': `Bearer ${managerToken}` }
    });
    assert('2.1: Manager retrieves incoming lead', mgrLeadRes.status === 200 && mgrLeadRes.body.customer_name === 'Rohan_Mehta');

    // Department Validation: Rahul is Domestic Tour specialist; Swiss is International/Honeymoon
    const invalidAssignRes = await request(PORT, {
      path: '/api/admin/leads/assign', method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${managerToken}`
      }
    }, {
      lead_ids: [leadId],
      staff_id: rahulId // Domestic only
    });
    assert('2.2: Cross-department assignment rejected (Domestic staff on International enquiry)', invalidAssignRes.status === 400 && invalidAssignRes.body.error.includes('domestic tour management staff'));

    // Operations staff cannot be assigned to sales enquiry
    const opsAssignRes = await request(PORT, {
      path: '/api/admin/leads/assign', method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${managerToken}`
      }
    }, {
      lead_ids: [leadId],
      staff_id: opsId // Operations only
    });
    assert('2.3: Operations staff assignment to sales enquiry rejected', opsAssignRes.status === 400 && opsAssignRes.body.error.includes('Operation staff'));

    // Valid Multi-Staff Assignment: Priya (Primary) + Rahul (Supporting)
    const validAssignRes = await request(PORT, {
      path: '/api/admin/leads/assign', method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${managerToken}`
      }
    }, {
      lead_ids: [leadId],
      staff_id: priyaId,
      notes: 'High-priority luxury honeymoon enquiry.'
    });
    assert('2.4: Valid assignment to qualified staff succeeds (HTTP 200)', validAssignRes.status === 200 && validAssignRes.body.success === true);

    // -------------------------------------------------------------------------
    // STAGE 3: Staff Access & Status Transition Engine
    // -------------------------------------------------------------------------
    console.log('\n--- STAGE 3: Staff Lead Management & Status Transitions ---');

    // Assigned staff Priya accesses lead
    const priyaLeadRes = await request(PORT, {
      path: `/api/staff/leads/${leadId}`, method: 'GET',
      headers: { 'Authorization': `Bearer ${priyaToken}` }
    });
    assert('3.1: Assigned Staff Priya accesses lead queue', priyaLeadRes.status === 200 && priyaLeadRes.body.lead.id === leadId);

    // Unassigned staff Rahul cannot access Priya's lead
    const unauthLeadRes = await request(PORT, {
      path: `/api/staff/leads/${leadId}`, method: 'GET',
      headers: { 'Authorization': `Bearer ${rahulToken}` }
    });
    assert('3.2: Unassigned staff access denied (HTTP 403 Forbidden)', unauthLeadRes.status === 403);

    // Staff logs customer interaction
    const interactionRes = await request(PORT, {
      path: `/api/staff/leads/${leadId}/interactions`, method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${priyaToken}`
      }
    }, {
      interaction_type: 'call',
      notes: 'Spoke with Rohan regarding travel dates and preferred luxury hotels in Interlaken.',
      customer_response: 'Customer confirmed dates and requested customized 7-day quote.',
      follow_up_date: '2026-11-28'
    });
    assert('3.3: Staff logs customer communication activity', interactionRes.status === 201 && interactionRes.body.success === true);

    // Staff updates status to Contacted
    const statusContactedRes = await request(PORT, {
      path: `/api/staff/leads/${leadId}/status`, method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${priyaToken}`
      }
    }, {
      status: 'Contacted',
      notes: 'Initial phone consultation completed.'
    });
    assert('3.4: Staff updates lead status to Contacted', statusContactedRes.status === 200 && statusContactedRes.body.status === 'Contacted');

    // Staff attempts to mark Lost without reason -> Blocked
    const lostNoReasonRes = await request(PORT, {
      path: `/api/staff/leads/${leadId}/status`, method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${priyaToken}`
      }
    }, {
      status: 'Lost / Dropped'
    });
    assert('3.5: Marking lead as Lost without reason is rejected (HTTP 400)', lostNoReasonRes.status === 400 && lostNoReasonRes.body.error.includes('reason is required'));

    // Staff attempts to mark Converted directly without conversion request -> Blocked
    const directConvertRes = await request(PORT, {
      path: `/api/staff/leads/${leadId}/status`, method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${priyaToken}`
      }
    }, {
      status: 'Converted to Booking'
    });
    assert('3.6: Direct status conversion by staff blocked (requires conversion request)', directConvertRes.status === 400 && directConvertRes.body.error.includes('booking conversion request'));

    // -------------------------------------------------------------------------
    // STAGE 4: Booking Conversion Request & Manager Approval Handover
    // -------------------------------------------------------------------------
    console.log('\n--- STAGE 4: Booking Conversion Request & Payment Verification ---');

    // Staff submits booking conversion request with payment evidence
    const convertRequestRes = await request(PORT, {
      path: `/api/staff/leads/${leadId}/convert`, method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${priyaToken}`
      }
    }, {
      total_amount: 320000,
      advance_amount: 80000,
      payment_method: 'UPI',
      transaction_reference: `UPI-SWISS-${timestamp}`,
      payment_proof: `https://storage.travelgenie.com/proofs/upi-swiss-${timestamp}.png`,
      travel_start_date: '2026-12-15',
      travel_end_date: '2026-12-22',
      travelers_count: 2,
      special_requests: 'Honeymoon special cake and flower bouquet in Lucerne'
    });

    assert('4.1: Staff submits conversion request with payment evidence (HTTP 201)', convertRequestRes.status === 201 && convertRequestRes.body.pending_approval === true);
    assert('4.2: Conversion request created in PENDING_APPROVAL status', convertRequestRes.body.conversion_request.status === 'PENDING_APPROVAL');
    const conversionRequestId = convertRequestRes.body.conversion_request.id;

    // Staff attempts to self-approve conversion request -> Blocked
    const selfApproveRes = await request(PORT, {
      path: `/api/admin/bookings/conversion-requests/${conversionRequestId}/approve`, method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${priyaToken}`
      }
    }, {
      verification_notes: 'Self-approval attempt by sales staff'
    });
    assert('4.3: Staff self-approval of conversion request blocked (HTTP 403 Forbidden)', selfApproveRes.status === 403);

    // Manager reviews conversion requests queue
    const requestsListRes = await request(PORT, {
      path: '/api/admin/bookings/conversion-requests?status=PENDING_APPROVAL', method: 'GET',
      headers: { 'Authorization': `Bearer ${managerToken}` }
    });
    assert('4.4: Manager views pending conversion requests queue', requestsListRes.status === 200 && Array.isArray(requestsListRes.body));
    const foundRequest = requestsListRes.body.find(r => r.id === conversionRequestId);
    assert('4.5: Staff conversion request present in Manager queue', !!foundRequest && foundRequest.advance_amount === 80000);

    // Manager verifies payment and approves conversion
    const approveRes = await request(PORT, {
      path: `/api/admin/bookings/conversion-requests/${conversionRequestId}/approve`, method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${managerToken}`
      }
    }, {
      verification_notes: 'Verified ₹80,000 via ICICI Bank current account UPI settlement.'
    });

    assert('4.6: Manager approves conversion & verifies payment (HTTP 200)', approveRes.status === 200 && approveRes.body.success === true);
    assert('4.7: Confirmed booking created with booking number (BK-YYYY-XXXX)', !!approveRes.body.booking && approveRes.body.booking.booking_number.startsWith('BK-'));
    assert('4.8: Booking advance amount recorded and verified', approveRes.body.booking.advance_amount === 80000);
    const bookingId = approveRes.body.booking.id;

    // -------------------------------------------------------------------------
    // STAGE 5: Customer Account Provisioning & Invitation Handover
    // -------------------------------------------------------------------------
    console.log('\n--- STAGE 5: Customer Account Creation & Secure Onboarding ---');

    // Staff attempts to create customer credentials -> Blocked
    const staffCreateCustRes = await request(PORT, {
      path: '/api/admin/customers/create-login', method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${priyaToken}`
      }
    }, {
      booking_id: bookingId,
      email: customerEmail
    });
    assert('5.1: Staff creation of customer login credentials blocked (HTTP 403 Forbidden)', staffCreateCustRes.status === 403);

    // Manager creates customer account linked to confirmed booking
    const createCustomerRes = await request(PORT, {
      path: '/api/admin/customers/create-login', method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${managerToken}`
      }
    }, {
      booking_id: bookingId,
      email: customerEmail
    });

    assert('5.2: Manager provisions customer account for verified booking (HTTP 201)', createCustomerRes.status === 201 && createCustomerRes.body.success === true);
    assert('5.3: Unique Customer ID generated (CUS-YYYY-XXXX)', !!createCustomerRes.body.customer_id && createCustomerRes.body.customer_id.startsWith('CUS-'));
    assert('5.4: Account status is INVITATION_SENT with single-use token', createCustomerRes.body.account_status === 'INVITATION_SENT');
    const customerCode = createCustomerRes.body.customer_id;
    const activationLink = createCustomerRes.body.activation_link;
    const activationToken = new URL(activationLink).searchParams.get('token');
    assert('5.5: Secure activation token extracted from dispatched onboarding invitation', !!activationToken);

    // -------------------------------------------------------------------------
    // STAGE 6: Customer Activation & Existing Dashboard Integration
    // -------------------------------------------------------------------------
    console.log('\n--- STAGE 6: Customer Account Activation & Dashboard Access ---');

    // Customer activates account and sets private password
    const activateRes = await request(PORT, {
      path: '/api/auth/activate-account', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      token: activationToken,
      password: 'TravelerSecure@2026'
    });
    assert('6.1: Customer activates account and establishes password (HTTP 200)', activateRes.status === 200 && activateRes.body.success === true);

    // Single-use token immediately invalidated (cannot reuse)
    const reuseTokenRes = await request(PORT, {
      path: '/api/auth/activate-account', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      token: activationToken,
      password: 'MaliciousReusePassword@123'
    });
    assert('6.2: Reused activation token rejected (HTTP 400)', reuseTokenRes.status === 400);

    // Customer logs in via standard login with email and newly created password
    const custLoginRes = await request(PORT, {
      path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: customerEmail,
      password: 'TravelerSecure@2026'
    });
    assert('6.3: Customer logs in via standard authentication (HTTP 200)', custLoginRes.status === 200 && !!custLoginRes.body.token);
    assert('6.4: Authenticated user role is customer', custLoginRes.body.user.role === 'customer');
    const customerToken = custLoginRes.body.token;

    // Customer accesses their personal dashboard
    const custDashboardRes = await request(PORT, {
      path: '/api/customer/dashboard', method: 'GET',
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    assert('6.5: Customer accesses personal dashboard (GET /api/customer/dashboard)', custDashboardRes.status === 200 && !!custDashboardRes.body.stats);

    // Customer accesses their confirmed bookings
    const custBookingsRes = await request(PORT, {
      path: '/api/customer/bookings', method: 'GET',
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    assert('6.6: Customer retrieves bookings list (GET /api/customer/bookings)', custBookingsRes.status === 200 && Array.isArray(custBookingsRes.body));
    const customerTrip = custBookingsRes.body.find(b => b.id === bookingId);
    assert('6.7: Confirmed Switzerland holiday present in Customer Bookings', !!customerTrip && customerTrip.package_title.includes('Switzerland'));
    assert('6.8: Verified advance payment of ₹80,000 reflected in booking balance', customerTrip.advance_amount === 80000 && customerTrip.balance_amount === 240000);

    // Customer accesses payment receipts
    const custPaymentsRes = await request(PORT, {
      path: '/api/customer/payments', method: 'GET',
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    assert('6.9: Customer views verified advance payment receipt', custPaymentsRes.status === 200 && custPaymentsRes.body.payments.some(p => p.booking_id === bookingId && p.amount === 80000));

    // Strict Data Isolation: Customer cannot see internal CRM logs or other customers' data
    assert('6.10: Customer cannot view internal CRM remarks or staff activities', !custDashboardRes.body.lead_activities && !custDashboardRes.body.staff_notes);

    // -------------------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------------------
    console.log('\n========================================================================');
    console.log(` B2C LIFECYCLE ACCEPTANCE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================================\n');

    server.close();
    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    server.close();
    process.exit(1);
  }
}

runB2CLifecycleTests();
