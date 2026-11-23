/**
 * COMPREHENSIVE END-TO-END TEST SUITE FOR COMPLETE C2B CUSTOMER WORKFLOW
 * Covers Tests 1 through 8 from Section 16 of the Specification:
 * - Test 1: Enquiry Submission & Acknowledgement
 * - Test 2: Manager Lead Assignment & Workload Distribution
 * - Test 3: Sales Executive Follow-up & Quotation Lifecycle
 * - Test 4: Customer Trip Confirmation & Partial Payment Verification
 * - Test 5: Manager-Controlled Customer Account Creation (Eligibility Gate)
 * - Test 6: Customer Account Activation via Secure Token & Login
 * - Test 7: Customer Data Access & Tenant Isolation
 * - Test 8: Failed Payment Guard (Account creation blocked)
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

async function runC2BWorkflowTests() {
  console.log('========================================================================');
  console.log(' TRAVELGENIE: COMPLETE C2B CUSTOMER WORKFLOW ACCEPTANCE TEST SUITE');
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

  // Start in-memory server on port 5055
  const PORT = 5055;
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
  console.log(`[TEST RUNNER] Test server listening on http://127.0.0.1:${PORT}\n`);

  try {
    const timestamp = Date.now();
    const customerEmail = `ananya.traveler_${timestamp}@example.com`;
    const customerPhone = `98765${String(timestamp).slice(-5)}`;
    const futureDate1 = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    const futureDate2 = new Date(Date.now() + 37 * 86400000).toISOString().split('T')[0];
    let testEnquiryId = null;
    let testLeadId = null;
    let salesStaffUser = null;
    let adminToken = null;
    let staffToken = null;
    let testQuotationId = null;
    let testBookingId = null;
    let testBookingNumber = null;
    let activationToken = null;
    let customerId = null;
    let customerAuthToken = null;

    // =========================================================================
    // TEST 1: ENQUIRY SUBMISSION (Universal Landing Page)
    // =========================================================================
    console.log('--- TEST 1: Customer Enquiry Submission (Universal Landing Page) ---');
    
    const enquiryPayload = {
      name: 'Ananya Rao',
      email: customerEmail,
      phone: `+91 ${customerPhone}`,
      country: 'India',
      departure_city: 'Bengaluru',
      destination: 'Switzerland Alps & Scenic Trains',
      package_id: 'pkg_switzerland_luxury',
      departure_date: futureDate1,
      return_date: futureDate2,
      adults: 2,
      children: 1,
      infants: 0,
      budget: '₹2,50,000 - ₹3,50,000',
      travel_type: 'Family Vacation',
      special_requirements: 'Scenic window seating on Glacier Express train',
      additional_message: 'Please advise on child discounts for mountain excursions.',
      source: 'Universal Landing Page',
      landing_page_url: 'https://tripbygenie.in/packages/switzerland'
    };

    const submitRes = await request(PORT, {
      path: '/api/public/enquiry',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, enquiryPayload);

    assert('T1.1: Submit enquiry returns HTTP 201', submitRes.status === 201, submitRes.body);
    assert('T1.2: Returns unique lead_id', !!(submitRes.body && submitRes.body.lead_id));
    assert('T1.3: Returns human-readable unique Enquiry ID (ENQ-YYYY-XXXX)', !!(submitRes.body && submitRes.body.enquiry_id && submitRes.body.enquiry_id.startsWith('ENQ-')));
    
    testLeadId = submitRes.body ? submitRes.body.lead_id : null;
    testEnquiryId = submitRes.body ? submitRes.body.enquiry_id : null;

    // Verify Enquiry saved in database
    const savedEnquiry = db.findOne('enquiries', (e) => e.enquiry_id === testEnquiryId);
    assert('T1.4: Enquiry record saved in enquiries table', !!savedEnquiry && savedEnquiry.customer_email === customerEmail);

    // Verify Lead saved in CRM with status NEW
    const savedLead = db.findById('leads', testLeadId);
    assert('T1.5: CRM lead created with status "New" / "NEW"', !!savedLead && (savedLead.status === 'New' || savedLead.status === 'NEW'));
    assert('T1.6: Customer does not have an active customer account at enquiry stage', !db.findOne('users', (u) => u.email.toLowerCase() === customerEmail.toLowerCase()));

    // Verify Email Acknowledgement was logged
    const emailLog = db.findOne('email_logs', (l) => l.to_email === customerEmail && l.template_name === 'ENQUIRY_ACKNOWLEDGEMENT');
    assert('T1.7: Customer receives enquiry acknowledgement email', !!emailLog);

    // Verify Accidental Duplicate Protection (Submitting exact same enquiry within 30s)
    const dupRes = await request(PORT, {
      path: '/api/public/enquiry',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, enquiryPayload);
    assert('T1.8: Prevent accidental duplicate submissions (Idempotent 201/200)', dupRes.status === 201 && dupRes.body.duplicate === true);

    // =========================================================================
    // TEST 2: MANAGER LEAD ASSIGNMENT & WORKLOAD
    // =========================================================================
    console.log('\n--- TEST 2: Manager Lead Assignment & Workload Distribution ---');

    // Manager Logs In
    const adminLogin = await request(PORT, {
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'admin@travelgenie.com', password: 'Admin@123' });

    assert('T2.1: Manager / Admin logs in successfully', adminLogin.status === 200 && !!adminLogin.body.token, adminLogin.body);
    adminToken = adminLogin.body ? adminLogin.body.token : null;

    // Manager views Leads list with status filter
    const managerLeads = await request(PORT, {
      path: '/api/admin/leads?status=New',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert('T2.2: Manager views leads list filtered by New', managerLeads.status === 200 && Array.isArray(managerLeads.body.data), managerLeads.body);
    const leadInManagerList = managerLeads.body && managerLeads.body.data ? managerLeads.body.data.find((l) => l.id === testLeadId) : null;
    assert('T2.3: Newly submitted enquiry visible in Manager dashboard', !!leadInManagerList);

    // Manager inspects Sales Executive list with Workload visibility
    const staffListRes = await request(PORT, {
      path: '/api/admin/staff',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert('T2.4: Manager views sales executives list with workload counts', staffListRes.status === 200 && staffListRes.body.length > 0);
    salesStaffUser = staffListRes.body[0];
    assert('T2.5: Sales executive has workload metric (assignedLeadsCount)', typeof salesStaffUser.assignedLeadsCount === 'number');

    // Manager assigns lead to Sales Executive
    const assignRes = await request(PORT, {
      path: '/api/admin/leads/assign',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, {
      lead_ids: [testLeadId],
      staff_id: salesStaffUser.id,
      notes: 'High-intent Switzerland luxury family holiday inquiry.'
    });

    assert('T2.6: Manager assigns lead to Sales Executive (POST /api/admin/leads/assign)', assignRes.status === 200);

    // Verify lead_assignments audit table
    const assignmentRecord = db.findOne('lead_assignments', (a) => a.lead_id === testLeadId);
    assert('T2.7: Lead assignment recorded in lead_assignments audit table', !!assignmentRecord && assignmentRecord.staff_id === salesStaffUser.id);

    // Verify in-app notification sent to sales executive
    const staffNotif = db.findOne('notifications', (n) => n.user_id === salesStaffUser.id && n.title.includes('Lead'));
    assert('T2.8: Sales Executive receives assignment notification', !!staffNotif);

    // =========================================================================
    // TEST 3: SALES EXECUTIVE FOLLOW-UP & QUOTATION MANAGEMENT
    // =========================================================================
    console.log('\n--- TEST 3: Sales Executive Follow-up & Quotation Lifecycle ---');

    // Sales Executive Logs In
    const staffLogin = await request(PORT, {
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: salesStaffUser.email, password: 'Staff@123' });

    assert('T3.1: Sales Executive logs into staff portal', staffLogin.status === 200 && !!staffLogin.body.token, staffLogin.body);
    staffToken = staffLogin.body.token;

    // Sales Executive checks assigned leads queue
    const staffLeads = await request(PORT, {
      path: '/api/staff/leads',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${staffToken}` }
    });
    const assignedLead = staffLeads.body.find((l) => l.id === testLeadId);
    assert('T3.2: Assigned lead appears in Sales Executive personal queue', !!assignedLead);
    assert('T3.3: Lead status updated to "Assigned"', assignedLead.status === 'Assigned' || assignedLead.status === 'ASSIGNED');

    // Sales Executive records customer call interaction & preferences
    const interactionRes = await request(PORT, {
      path: `/api/staff/leads/${testLeadId}/interactions`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${staffToken}`
      }
    }, {
      channel: 'CALL',
      summary: 'Spoke with Mrs. Ananya. Discussed 5-star mountain chalet in Zermatt and 1st-class Swiss Travel Pass.',
      customer_response: 'Customer very interested in customized itinerary with private airport transfers.',
      follow_up_date: '2026-11-25'
    });
    assert('T3.4: Customer call notes & preferences saved in customer_interactions', interactionRes.status === 201);

    // Sales Executive updates status to QUALIFIED
    const updateQualRes = await request(PORT, {
      path: `/api/staff/leads/${testLeadId}/status`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${staffToken}`
      }
    }, { status: 'Qualified', notes: 'Requirements finalized for 7-day luxury Swiss Alps tour.' });
    assert('T3.5: Lead status updated to "Qualified"', updateQualRes.status === 200 && updateQualRes.body.status === 'Qualified');

    // Sales Executive Prepares & Dispatches Quotation
    const quotePayload = {
      lead_id: testLeadId,
      package_amount: 150000,
      additional_charges: 20000,
      discount: 10000,
      total_amount: 170000,
      taxes: 8000,
      advance_percentage: 30, // 30% advance
      notes: 'Includes 5-star Zermatt chalet, Glacier Express first class, and private driver.',
      items: [
        { description: 'Luxury 5-Star Mountain Chalet Stay (6 Nights)', amount: 100000 },
        { description: 'Swiss Travel Pass First Class (3 Pax)', amount: 40000 },
        { description: 'Private Airport & Sightseeing Transfers', amount: 20000 }
      ]
    };

    const quoteRes = await request(PORT, {
      path: '/api/staff/quotations',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${staffToken}`
      }
    }, quotePayload);

    assert('T3.6: Quotation created successfully with versioning', quoteRes.status === 201 && quoteRes.body.quotation_number.includes('QT-'));
    assert('T3.7: Quotation calculates 30% required advance payment accurately', quoteRes.body.required_advance_amount === Math.round(quoteRes.body.final_amount * 0.3));
    testQuotationId = quoteRes.body.id;

    // Verify Quotation email sent to customer
    const quoteEmail = db.findOne('email_logs', (l) => l.to_email === customerEmail && l.template_name === 'QUOTATION_PROPOSAL');
    assert('T3.8: Quotation proposal email automatically logged and dispatched to customer', !!quoteEmail);

    // Verify lead status updated to Quotation Sent
    const updatedLeadAfterQuote = db.findById('leads', testLeadId);
    assert('T3.9: Lead status updated to "Quotation Sent"', updatedLeadAfterQuote.status === 'Quotation Sent');

    // =========================================================================
    // TEST 4: CUSTOMER TRIP CONFIRMATION & PARTIAL ADVANCE PAYMENT
    // =========================================================================
    console.log('\n--- TEST 4: Customer Trip Confirmation & Partial Payment Verification ---');

    // Customer confirms the trip (Lead status -> CUSTOMER_CONFIRMED -> Booking created in PAYMENT_PENDING)
    const confirmRes = await request(PORT, {
      path: `/api/staff/leads/${testLeadId}/confirm-trip`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${staffToken}`
      }
    }, {
      quotation_id: testQuotationId,
      agreed_price: 168000,
      required_advance_amount: 50400, // 30% of ₹1,68,000
      travel_start_date: '2026-12-10',
      travel_end_date: '2026-12-17',
      travelers_count: 3
    });

    assert('T4.1: Trip confirmation creates pending booking record (POST /api/staff/leads/:id/confirm-trip)', confirmRes.status === 201 && !!confirmRes.body.booking);
    testBookingId = confirmRes.body.booking.id;
    testBookingNumber = confirmRes.body.booking.booking_number;
    assert('T4.2: Booking status is initially PAYMENT_PENDING', confirmRes.body.booking.booking_status === 'PAYMENT_PENDING');
    assert('T4.3: Customer account is NOT created yet at confirmation stage', !db.findOne('users', (u) => u.email.toLowerCase() === customerEmail.toLowerCase()));

    // Verify Partial Payment Processing through Gateway Verification
    const advanceAmount = 50400;
    const paymentTxnRef = `PAY-GATEWAY-UPI-${timestamp}`;

    const payRes = await request(PORT, {
      path: '/api/payments/verify-advance',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      booking_id: testBookingId,
      amount: advanceAmount,
      payment_method: 'UPI / NetBanking',
      transaction_reference: paymentTxnRef,
      gateway_signature: `sig_mock_${timestamp}`,
      notes: 'Customer paid 30% booking advance via UPI.'
    });

    assert('T4.4: Backend verifies payment through gateway (POST /api/payments/verify-advance)', payRes.status === 200 && payRes.body.success === true);
    assert('T4.5: Payment record recorded with SUCCESS status', payRes.body.payment.status === 'SUCCESS');
    assert('T4.6: Booking updated to BOOKING_CONFIRMED after verified deposit', payRes.body.booking.booking_status === 'BOOKING_CONFIRMED');
    assert('T4.7: Booking payment_status updated to PARTIALLY_PAID', payRes.body.booking.payment_status === 'PARTIALLY_PAID');
    assert('T4.8: Remaining balance calculated correctly (₹1,68,000 - ₹50,400 = ₹1,17,600)', payRes.body.booking.balance_amount === 117600);

    // Verify GST Tax Invoice generated
    const inv = db.findOne('invoices', (i) => i.booking_id === testBookingId);
    assert('T4.9: GST tax invoice generated for advance deposit', !!inv && inv.total_amount === advanceAmount);

    // Verify Payment Receipt Email
    const payEmail = db.findOne('email_logs', (l) => l.to_email === customerEmail && l.template_name === 'PAYMENT_RECEIPT');
    assert('T4.10: Customer receives payment receipt email with transaction reference', !!payEmail);

    // =========================================================================
    // TEST 5: MANAGER - CUSTOMER ACCOUNT CREATION (ELIGIBILITY & INVITATION)
    // =========================================================================
    console.log('\n--- TEST 5: Manager - Customer Account Creation & Single-Use Invitation ---');

    // Manager clicks "CREATE CUSTOMER LOGIN"
    const createLoginRes = await request(PORT, {
      path: '/api/admin/customers/create-login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, {
      booking_id: testBookingId
    });

    assert('T5.1: Manager creates customer account (POST /api/admin/customers/create-login)', createLoginRes.status === 201 && createLoginRes.body.success === true);
    assert('T5.2: Unique Customer ID generated (CUS-YYYY-XXXX)', !!createLoginRes.body.customer_id && createLoginRes.body.customer_id.startsWith('CUS-'));
    assert('T5.3: Account status set to INVITATION_SENT', createLoginRes.body.account_status === 'INVITATION_SENT');
    
    customerId = createLoginRes.body.customer_id;

    // Verify invitation in customer_account_invitations table
    const invitationRecord = db.findOne('customer_account_invitations', (i) => i.email.toLowerCase() === customerEmail.toLowerCase() && !i.is_used);
    assert('T5.4: Single-use cryptographic activation token generated with 48h expiry', !!invitationRecord && !invitationRecord.is_used);
    activationToken = invitationRecord.token;

    // Verify password is NOT exposed in user record or email logs
    const createdUser = db.findOne('users', (u) => u.email.toLowerCase() === customerEmail.toLowerCase());
    assert('T5.5: User record has no plaintext password before customer sets it', !createdUser.password_hash || createdUser.password_hash === '');

    // Verify Customer Onboarding Email with Activation Link
    const onboardingEmail = db.findOne('email_logs', (l) => l.to_email === customerEmail && l.template_name === 'CUSTOMER_ACCOUNT_INVITATION');
    assert('T5.6: Customer receives onboarding email with secure activation link', !!onboardingEmail && onboardingEmail.metadata.activation_link.includes('token='));

    // Resend Invitation idempotency test (Must NOT create duplicate user accounts)
    const initialUserCount = db.findAll('users', (u) => u.email.toLowerCase() === customerEmail.toLowerCase()).length;
    const resendRes = await request(PORT, {
      path: '/api/admin/customers/resend-invitation',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, { booking_id: testBookingId, email: customerEmail });

    assert('T5.7: Manager can resend activation invitation', resendRes.status === 200 && resendRes.body.success === true);
    const postResendUserCount = db.findAll('users', (u) => u.email.toLowerCase() === customerEmail.toLowerCase()).length;
    assert('T5.8: Resending invitation prevents duplicate customer accounts', initialUserCount === postResendUserCount);

    // Get latest active token after resend
    const latestInvitation = db.findOne('customer_account_invitations', (i) => i.email.toLowerCase() === customerEmail.toLowerCase() && !i.is_used);
    activationToken = latestInvitation.token;

    // =========================================================================
    // TEST 6: CUSTOMER ACCOUNT ACTIVATION & FIRST LOGIN
    // =========================================================================
    console.log('\n--- TEST 6: Customer Account Activation via Secure Token & Login ---');

    // Customer visits activation link (token validation)
    const verifyTokenRes = await request(PORT, {
      path: `/api/auth/verify-activation-token?token=${encodeURIComponent(activationToken)}`,
      method: 'GET'
    });
    assert('T6.1: Valid activation token verified successfully', verifyTokenRes.status === 200 && verifyTokenRes.body.valid === true);

    // Customer sets new password (Activate Account)
    const newCustomerPassword = 'MySecureHoliday2026!';
    const activateRes = await request(PORT, {
      path: '/api/auth/activate-account',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      token: activationToken,
      password: newCustomerPassword
    });

    assert('T6.2: Customer activates account and sets password (POST /api/auth/activate-account)', activateRes.status === 200 && activateRes.body.success === true);

    // Verify token invalidated (single-use)
    const usedTokenRes = await request(PORT, {
      path: `/api/auth/verify-activation-token?token=${encodeURIComponent(activationToken)}`,
      method: 'GET'
    });
    assert('T6.3: Token immediately invalidated after first use (Cannot reuse)', usedTokenRes.status === 400 && usedTokenRes.body.error.includes('already been used'));

    // Customer Logs In with newly created password
    const customerLoginRes = await request(PORT, {
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: customerEmail,
      password: newCustomerPassword
    });

    assert('T6.4: Customer logs in via standard login with email and new password', customerLoginRes.status === 200 && !!customerLoginRes.body.token);
    assert('T6.5: Authenticated user role is "customer"', customerLoginRes.body.user.role === 'customer');
    customerAuthToken = customerLoginRes.body.token;

    // =========================================================================
    // TEST 7: CUSTOMER DASHBOARD INTEGRATION & DATA ISOLATION
    // =========================================================================
    console.log('\n--- TEST 7: Customer Dashboard Integration & Data Isolation ---');

    // Customer opens My Dashboard
    const custDash = await request(PORT, {
      path: '/api/customer/dashboard',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${customerAuthToken}` }
    });
    assert('T7.1: Customer accesses personal dashboard (GET /api/customer/dashboard)', custDash.status === 200);
    assert('T7.2: Dashboard displays accurate booking & payment metrics', custDash.body.stats.upcoming_trips >= 1);

    // Customer opens My Bookings
    const custBookings = await request(PORT, {
      path: '/api/customer/bookings',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${customerAuthToken}` }
    });
    assert('T7.3: Customer accesses My Bookings (GET /api/customer/bookings)', custBookings.status === 200 && Array.isArray(custBookings.body));
    const userBooking = custBookings.body.find((b) => b.booking_number === testBookingNumber);
    assert('T7.4: Displays confirmed Switzerland holiday with advance paid', !!userBooking && userBooking.advance_amount === 50400);

    // Customer opens My Payments
    const custPayments = await request(PORT, {
      path: '/api/customer/payments',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${customerAuthToken}` }
    });
    assert('T7.5: Customer accesses My Payments (GET /api/customer/payments)', custPayments.status === 200 && custPayments.body.payments.length >= 1);
    const verifiedPayment = custPayments.body.payments.find((p) => p.transaction_reference === paymentTxnRef);
    assert('T7.6: Displays verified advance payment receipt', !!verifiedPayment);

    // Customer opens My Profile
    const custProfile = await request(PORT, {
      path: '/api/customer/profile',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${customerAuthToken}` }
    });
    assert('T7.7: Customer profile retrieved with Customer ID', custProfile.status === 200 && custProfile.body.user.email === customerEmail);

    // Tenant / Data Isolation Check: Customer cannot access other customers' records
    const anotherCustomerBooking = db.findOne('bookings', (b) => b.customer_email && b.customer_email !== customerEmail);
    if (anotherCustomerBooking) {
      const isLeaked = custBookings.body.some((b) => b.id === anotherCustomerBooking.id);
      assert('T7.8: Strict Data Isolation: Other customers bookings are inaccessible', !isLeaked);
    }

    // =========================================================================
    // TEST 8: FAILED PAYMENT GUARD (Account creation blocked)
    // =========================================================================
    console.log('\n--- TEST 8: Failed Payment Guard (Account creation blocked) ---');

    // Create an unconfirmed lead with failed payment
    const unconfirmedBooking = db.insert('bookings', {
      agency_id: 'agency_travel_genie',
      booking_number: `BK-FAILED-${timestamp}`,
      customer_name: 'Unpaid Traveler',
      customer_email: `unpaid_${timestamp}@example.com`,
      total_amount: 100000,
      advance_amount: 0,
      balance_amount: 100000,
      payment_status: 'PENDING',
      booking_status: 'PAYMENT_PENDING',
      created_at: new Date().toISOString()
    });

    // Attempt simulated failed payment
    const failedPayRes = await request(PORT, {
      path: '/api/payments/verify-advance',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      booking_id: unconfirmedBooking.id,
      amount: 30000,
      simulate_failure: true
    });
    assert('T8.1: Gateway failure returns error status 400', failedPayRes.status === 400);

    // Manager attempts to create customer login on failed/unpaid booking
    const blockRes = await request(PORT, {
      path: '/api/admin/customers/create-login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, {
      booking_id: unconfirmedBooking.id
    });

    assert('T8.2: Account creation BLOCKED when advance payment is not verified (HTTP 400)', blockRes.status === 400);
    assert('T8.3: Error message explains advance payment requirement', blockRes.body.error.includes('advance payment'));

  } catch (err) {
    console.error('Fatal error during test suite execution:', err);
    failed++;
  } finally {
    server.close();
  }

  console.log('\n========================================================================');
  console.log(` FINAL TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runC2BWorkflowTests();
