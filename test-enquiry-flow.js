/**
 * Comprehensive Test Suite for Trip Enquiry Form Validations and Manager-to-Sales Staff Assignment
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

async function runEnquiryAndAssignmentTests() {
  console.log('========================================================================');
  console.log(' TRAVELGENIE: ENQUIRY VALIDATIONS & MANAGER -> SALES STAFF ASSIGNMENT');
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

  // Start in-memory server on an available port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const PORT = server.address().port;
  console.log(`[TEST RUNNER] Test server listening on http://127.0.0.1:${PORT}\n`);

  try {
    // ---------------------------------------------------------
    // SECTION 1: FIELD VALIDATION TESTS
    // ---------------------------------------------------------
    console.log('--- SECTION 1: Input Field Validation Tests ---');

    // 1.1 Name Validations
    const resEmptyName = await request(PORT, {
      path: '/api/public/enquiry', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      name: '', email: 'valid@example.com', phone: '+91 9876543210', destination: 'Bali'
    });
    assert('Reject Empty Name', resEmptyName.status === 400 && resEmptyName.body.error.includes('Name is required'));

    const resNumericName = await request(PORT, {
      path: '/api/public/enquiry', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      name: '12345678', email: 'valid@example.com', phone: '+91 9876543210', destination: 'Bali'
    });
    assert('Reject Name with Only Numbers', resNumericName.status === 400 && resNumericName.body.error.includes('only numbers'));

    const resSpecialCharName = await request(PORT, {
      path: '/api/public/enquiry', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      name: 'John@Doe#Traveler', email: 'valid@example.com', phone: '+91 9876543210', destination: 'Bali'
    });
    assert('Reject Name with Illegal Special Characters', resSpecialCharName.status === 400 && resSpecialCharName.body.error.includes('special characters'));

    // 1.2 Email Validations
    const resEmptyEmail = await request(PORT, {
      path: '/api/public/enquiry', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      name: 'Valid Traveler', email: '', phone: '+91 9876543210', destination: 'Bali'
    });
    assert('Reject Empty Email', resEmptyEmail.status === 400 && resEmptyEmail.body.error.includes('Email Address is required'));

    const resInvalidEmailFormat = await request(PORT, {
      path: '/api/public/enquiry', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      name: 'Valid Traveler', email: 'travelerWithoutDomain', phone: '+91 9876543210', destination: 'Bali'
    });
    assert('Reject Email Without Valid Domain', resInvalidEmailFormat.status === 400 && resInvalidEmailFormat.body.error.includes('valid email address with a domain'));

    // 1.3 Mobile / Phone Validations
    const resEmptyPhone = await request(PORT, {
      path: '/api/public/enquiry', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      name: 'Valid Traveler', email: 'valid@example.com', phone: '', destination: 'Bali'
    });
    assert('Reject Empty Phone', resEmptyPhone.status === 400 && resEmptyPhone.body.error.includes('Mobile number is required'));

    const resShortPhone = await request(PORT, {
      path: '/api/public/enquiry', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      name: 'Valid Traveler', email: 'valid@example.com', phone: '+91 98765', destination: 'Bali'
    });
    assert('Reject Phone with Less Than 10 Digits', resShortPhone.status === 400 && resShortPhone.body.error.includes('10 digits'));

    // 1.4 Destination Validations
    const resEmptyDest = await request(PORT, {
      path: '/api/public/enquiry', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      name: 'Valid Traveler', email: 'valid@example.com', phone: '+91 9876543210', destination: ''
    });
    assert('Reject Empty Destination', resEmptyDest.status === 400 && resEmptyDest.body.error.includes('Destination is required'));

    const resNumericDest = await request(PORT, {
      path: '/api/public/enquiry', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      name: 'Valid Traveler', email: 'valid@example.com', phone: '+91 9876543210', destination: '998877'
    });
    assert('Reject Destination with Only Numbers', resNumericDest.status === 400 && resNumericDest.body.error.includes('Destination cannot be only numbers'));

    // 1.5 Departure City Validations
    const resNumericCity = await request(PORT, {
      path: '/api/public/enquiry', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      name: 'Valid Traveler', email: 'valid@example.com', phone: '+91 9876543210', destination: 'Bali', departure_city: '560001'
    });
    assert('Reject Departure City with Only Numbers', resNumericCity.status === 400 && resNumericCity.body.error.includes('Departure city cannot be only numbers'));

    // 1.6 Travel Date Validations
    const resPastDate = await request(PORT, {
      path: '/api/public/enquiry', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      name: 'Valid Traveler', email: 'valid@example.com', phone: '+91 9876543210', destination: 'Bali', travel_date: '2020-01-01'
    });
    assert('Reject Past Travel Date', resPastDate.status === 400 && resPastDate.body.error.includes('past'));

    // ---------------------------------------------------------
    // SECTION 2: END-TO-END FLOW: SUBMIT -> MANAGER -> SALES ASSIGNMENT
    // ---------------------------------------------------------
    console.log('\n--- SECTION 2: Manager & Sales Staff Assignment Workflow ---');

    // Step 2.1: Submit Valid Enquiry
    const customerEnquiryData = {
      name: 'Deepak_Sharma',
      email: `deepak.custom_${Date.now()}@gmail.com`,
      phone: '+91 9876543210',
      destination: 'Switzerland & Paris Honeymoon',
      departure_city: 'Chennai',
      travel_date: '2026-12-20',
      travelers_count: 2,
      budget: '₹1,00,000 - ₹2,00,000',
      hotel_preference: '4-Star Premium Hotel',
      travel_preference: 'Couples / Romantic',
      additional_requirements: 'Require candlelight dinner and scenic train passes in Lucerne.',
      source: 'Customized Trip Form'
    };

    const submitRes = await request(PORT, {
      path: '/api/public/enquiry', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, customerEnquiryData);

    assert('Customer Submits Valid Enquiry Form (POST /api/public/enquiry)', submitRes.status === 201 && submitRes.body.success === true);
    const newLeadId = submitRes.body.lead_id;
    assert('Enquiry Returns Unique Lead ID', !!newLeadId, `Received ID: ${newLeadId}`);

    // Step 2.2: Manager / Admin Logs In
    const adminLoginRes = await request(PORT, {
      path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: 'admin@travelgenie.com',
      password: 'Admin@123'
    });

    assert('Manager Logs In (POST /api/auth/login)', adminLoginRes.status === 200 && !!adminLoginRes.body.token);
    const managerToken = adminLoginRes.body.token;

    // Step 2.3: Manager Views Incoming Leads
    const leadsRes = await request(PORT, {
      path: '/api/admin/leads?status=New', method: 'GET',
      headers: { 'Authorization': `Bearer ${managerToken}` }
    });

    assert('Manager Views Leads List (GET /api/admin/leads)', leadsRes.status === 200 && Array.isArray(leadsRes.body.data || leadsRes.body));
    const leadsList = leadsRes.body.data || leadsRes.body;
    const submittedLead = leadsList.find(l => l.id === newLeadId);
    assert('Manager Sees Newly Submitted Enquiry in Queue', !!submittedLead, `Lead ${newLeadId} not found in manager queue`);
    if (submittedLead) {
      assert('Submitted Lead has Status "New"', submittedLead.status === 'New');
      assert('Submitted Lead is Currently Unassigned', submittedLead.assigned_staff_name === 'Unassigned');
      assert('Customer Name matches', submittedLead.customer_name === 'Deepak_Sharma');
      assert('Destination matches', submittedLead.interested_destination.includes('Switzerland'));
    }

    // Step 2.4: Manager Retrieves Sales Staff List
    const staffRes = await request(PORT, {
      path: '/api/admin/users?role=staff', method: 'GET',
      headers: { 'Authorization': `Bearer ${managerToken}` }
    });

    assert('Manager Fetches Sales Staff List (GET /api/admin/users?role=staff)', staffRes.status === 200);
    const staffMembers = Array.isArray(staffRes.body) ? staffRes.body : staffRes.body.data || [];
    const salesPerson = staffMembers.find(s => s.email.includes('priya.staff')) || staffMembers[0];
    assert('Sales Staff Member Found for Assignment', !!salesPerson, `Selected: ${salesPerson?.name}`);

    // Step 2.5: Manager Assigns Lead to Sales Staff
    const assignRes = await request(PORT, {
      path: '/api/admin/leads/assign', method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${managerToken}`
      }
    }, {
      lead_ids: [newLeadId],
      staff_id: salesPerson.id,
      notes: 'High priority European honeymoon enquiry. Please prepare customized quote with 4-star hotels.'
    });

    assert('Manager Assigns Lead to Sales Staff (POST /api/admin/leads/assign)', assignRes.status === 200 && assignRes.body.success === true);

    // Step 2.6: Sales Staff Logs In
    const staffLoginRes = await request(PORT, {
      path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: salesPerson.email,
      password: 'Staff@123'
    });

    assert('Sales Staff Logs In (POST /api/auth/login)', staffLoginRes.status === 200 && !!staffLoginRes.body.token);
    const staffToken = staffLoginRes.body.token;

    // Step 2.7: Sales Staff Views Their Assigned Leads Queue
    const staffQueueRes = await request(PORT, {
      path: '/api/staff/leads', method: 'GET',
      headers: { 'Authorization': `Bearer ${staffToken}` }
    });

    assert('Sales Staff Views Personal Lead Queue (GET /api/staff/leads)', staffQueueRes.status === 200);
    const myLeads = Array.isArray(staffQueueRes.body) ? staffQueueRes.body : staffQueueRes.body.data || [];
    const assignedLeadInQueue = myLeads.find(l => l.id === newLeadId);
    assert('Assigned Lead Appears in Sales Staff Queue', !!assignedLeadInQueue, `Lead ${newLeadId} not in staff queue`);
    if (assignedLeadInQueue) {
      assert('Lead Status Updated to "Assigned"', assignedLeadInQueue.status === 'Assigned');
      assert('Assigned Staff ID matches Sales Staff', assignedLeadInQueue.assigned_staff_id === salesPerson.id);
      assert('Assigned Staff Name matches Sales Staff', assignedLeadInQueue.assigned_staff_name === salesPerson.name);
    }

    // Step 2.8: Verify Lead Detail and Activity Log
    const leadDetailRes = await request(PORT, {
      path: `/api/staff/leads/${newLeadId}`, method: 'GET',
      headers: { 'Authorization': `Bearer ${staffToken}` }
    });

    assert('Sales Staff Can Access Lead Details & Timeline', leadDetailRes.status === 200);
    const activities = leadDetailRes.body.activities || [];
    const hasCreationActivity = activities.some(a => a.description.includes('enquiry form'));
    const hasAssignmentActivity = activities.some(a => a.activity_type === 'assignment' || a.description.includes(salesPerson.name));
    assert('Audit Timeline Records Lead Creation Event', hasCreationActivity);
    assert('Audit Timeline Records Manager Assignment Event', hasAssignmentActivity);

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    server.close();
  }

  console.log('\n========================================================================');
  console.log(` TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runEnquiryAndAssignmentTests();
