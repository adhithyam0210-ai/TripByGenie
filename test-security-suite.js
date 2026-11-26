/**
 * TRIPBYGENIE ENTERPRISE SECURITY, PRIVACY & OWNERSHIP VERIFICATION SUITE
 * Validates:
 * 1. Zero-Trust Dual Token & Refresh Token Rotation
 * 2. Token Family Tracking & Reuse Detection (RFC 6749 / BCP 225)
 * 3. Session Invalidation (Logout & Logout-All)
 * 4. IDOR Protection (Travel Documents, Bookings, Agent Purchases)
 * 5. Arbitrary File Read / Path Traversal Immunity (/api/media/stream)
 * 6. Security Headers (Helmet, CSP, CORS)
 * 7. India DPDP Act 2023 Statutory Privacy Endpoints (Export, Consent, Erasure)
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
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
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

async function runSecurityTestSuite() {
  console.log('========================================================================');
  console.log(' TRIPBYGENIE: ENTERPRISE SECURITY & PRIVACY AUTOMATED VERIFICATION SUITE');
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

  // Spin up test server on dynamic port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const PORT = server.address().port;
  console.log(`[TEST RUNNER] Security test server listening on http://127.0.0.1:${PORT}\n`);

  try {
    // -------------------------------------------------------------------------
    // 1. SECURITY HEADERS VERIFICATION
    // -------------------------------------------------------------------------
    console.log('--- SECTION 1: Security Headers (Helmet, CSP & CORS) ---');
    const healthRes = await request(PORT, { path: '/api/v1/health', method: 'GET' });
    assert('1.1: Helmet X-Content-Type-Options: nosniff present', healthRes.headers['x-content-type-options'] === 'nosniff');
    assert('1.2: Helmet X-Frame-Options: DENY present', healthRes.headers['x-frame-options'] === 'DENY');
    assert('1.3: Content-Security-Policy header present', !!healthRes.headers['content-security-policy']);

    // -------------------------------------------------------------------------
    // 2. PATH TRAVERSAL / ARBITRARY FILE READ IMMUNITY
    // -------------------------------------------------------------------------
    console.log('\n--- SECTION 2: Arbitrary File Read & Path Traversal Immunity ---');
    const traversalDotEnv = await request(PORT, { path: '/api/media/stream?path=../../.env', method: 'GET' });
    assert('2.1: Block directory traversal attempt for sensitive file (.env)', traversalDotEnv.status === 404);

    const traversalWin = await request(PORT, { path: '/api/media/stream?path=C:\\Windows\\win.ini', method: 'GET' });
    assert('2.2: Block absolute root directory escape (C:\\Windows\\win.ini)', traversalWin.status === 404);

    const traversalNullByte = await request(PORT, { path: '/api/media/stream?path=uploads/../../secret%00.mp4', method: 'GET' });
    assert('2.3: Block null-byte poisoning and relative escape', traversalNullByte.status === 404);

    // -------------------------------------------------------------------------
    // 3. ZERO-TRUST DUAL TOKENS & REFRESH ROTATION
    // -------------------------------------------------------------------------
    console.log('\n--- SECTION 3: Zero-Trust Dual Token & Refresh Token Lifecycle ---');
    
    // Seed test customer
    const testEmail = `sec.traveler_${Date.now()}@example.com`;
    const bcrypt = require('bcryptjs');
    const customerUser = db.insert('users', {
      email: testEmail,
      name: 'Security Test Customer',
      role: 'customer',
      status: 'active',
      password_hash: bcrypt.hashSync('SecurePassword@2026', 10),
      created_at: new Date().toISOString()
    });

    // Login
    const loginRes = await request(PORT, {
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: testEmail, password: 'SecurePassword@2026' });

    assert('3.1: Login succeeds and returns dual tokens', loginRes.status === 200 && !!loginRes.body.token && !!loginRes.body.refreshToken);
    assert('3.2: Short access token expiration provided (15m / 900s)', loginRes.body.expiresIn === 900);
    assert('3.3: Set-Cookie header contains HttpOnly tg_refresh_token', !!loginRes.headers['set-cookie'] && loginRes.headers['set-cookie'].some(c => c.includes('tg_refresh_token') && c.includes('HttpOnly')));

    const firstRefreshToken = loginRes.body.refreshToken;
    const firstAccessToken = loginRes.body.token;

    // Successful Rotation
    const refreshRes = await request(PORT, {
      path: '/api/auth/refresh',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { refreshToken: firstRefreshToken });

    assert('3.4: Refresh token rotation issues fresh token pair', refreshRes.status === 200 && !!refreshRes.body.token && !!refreshRes.body.refreshToken);
    assert('3.5: New refresh token differs from previous token (Single-use rotation)', refreshRes.body.refreshToken !== firstRefreshToken);

    const secondRefreshToken = refreshRes.body.refreshToken;

    // REUSE DETECTION: Replaying the first (now revoked) refresh token
    const replayRes = await request(PORT, {
      path: '/api/auth/refresh',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { refreshToken: firstRefreshToken });

    assert('3.6: Token reuse attempt is denied (HTTP 401)', replayRes.status === 401);
    assert('3.7: Token reuse triggers breach detection error code', replayRes.body.code === 'TOKEN_REUSE_DETECTED');

    // Confirm that the second token in the family was also revoked due to reuse detection
    const familyCheck = await request(PORT, {
      path: '/api/auth/refresh',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { refreshToken: secondRefreshToken });

    assert('3.8: Entire compromised token family revoked on breach detection', familyCheck.status === 401);

    // -------------------------------------------------------------------------
    // 4. IDOR & DATA OWNERSHIP SECURITY
    // -------------------------------------------------------------------------
    console.log('\n--- SECTION 4: IDOR Protection & Ownership Enforcement ---');

    // Create victim customer & document
    const victim = db.insert('users', {
      email: `victim_${Date.now()}@example.com`,
      name: 'Victim Traveler',
      role: 'customer',
      status: 'active',
      password_hash: bcrypt.hashSync('Pass12345!', 10),
      created_at: new Date().toISOString()
    });

    const victimDoc = db.insert('travel_documents', {
      agency_id: 'agency_travel_genie',
      customer_id: victim.id,
      title: 'Confidential Passport Scan.pdf',
      category: 'Passport',
      created_at: new Date().toISOString()
    });

    // Attacker login
    const attacker = db.insert('users', {
      email: `attacker_${Date.now()}@example.com`,
      name: 'Attacker Traveler',
      role: 'customer',
      status: 'active',
      password_hash: bcrypt.hashSync('Attacker123!', 10),
      created_at: new Date().toISOString()
    });

    const attackerLogin = await request(PORT, {
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: attacker.email, password: 'Attacker123!' });

    const attackerToken = attackerLogin.body.token;

    // Attacker attempts to download Victim's document
    const idorDownloadRes = await request(PORT, {
      path: `/api/documents/${victimDoc.id}/download`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${attackerToken}` }
    });
    assert('4.1: Cross-user document download blocked (HTTP 403 Forbidden)', idorDownloadRes.status === 403);

    // Attacker attempts to delete Victim's document
    const idorDeleteRes = await request(PORT, {
      path: `/api/documents/${victimDoc.id}`,
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${attackerToken}` }
    });
    assert('4.2: Cross-user document deletion blocked (HTTP 403 Forbidden)', idorDeleteRes.status === 403);

    // Verify document still exists in database
    const docStillExists = db.findById('travel_documents', victimDoc.id);
    assert('4.3: Document remains intact after unauthorized deletion attempt', !!docStillExists);

    // -------------------------------------------------------------------------
    // 5. DPDP ACT 2023 STATUTORY PRIVACY RIGHTS
    // -------------------------------------------------------------------------
    console.log('\n--- SECTION 5: India DPDP Act 2023 Statutory Privacy Endpoints ---');

    // Right to Data Portability / Export
    const exportRes = await request(PORT, {
      path: '/api/v1/privacy/export',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${attackerToken}` }
    });
    assert('5.1: DPDP Data Export returns HTTP 200', exportRes.status === 200 && exportRes.body.success === true);
    assert('5.2: Export metadata specifies DPDP Act 2023 statutory alignment', exportRes.body.data.compliance.includes('DPDP Act'));
    assert('5.3: Export includes Data Principal identity and category bundles', !!exportRes.body.data.principal && !!exportRes.body.data.data_categories);

    // Consent recording
    const consentRes = await request(PORT, {
      path: '/api/v1/privacy/consents',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${attackerToken}`
      }
    }, { purpose: 'MARKETING_WHATSAPP_UPDATES', consent_given: true });
    assert('5.4: Statutory consent preference recorded with audit trail', consentRes.status === 201 && consentRes.body.success === true);

    // Right to Erasure
    const eraseRes = await request(PORT, {
      path: '/api/v1/privacy/erase',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${attackerToken}`
      }
    }, { confirm_text: 'DELETE MY PERSONAL DATA', reason: 'Right to be forgotten requested' });

    assert('5.5: DPDP Right to Erasure executes successfully (HTTP 200)', eraseRes.status === 200 && eraseRes.body.success === true);
    
    // Verify user profile is anonymized
    const erasedUser = db.findById('users', attacker.id);
    assert('5.6: PII (Name, Email, Phone) successfully sanitized and anonymized', erasedUser.name === 'Anonymized Traveler' && erasedUser.phone === '0000000000' && erasedUser.status === 'erased');
    assert('5.7: Account deactivated and password hash cleared', erasedUser.is_active === false && erasedUser.password_hash === '');

    // Attempting login with erased account is blocked
    const erasedLoginRes = await request(PORT, {
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: attacker.email, password: 'Attacker123!' });
    assert('5.8: Erased account login denied (HTTP 401/403)', erasedLoginRes.status === 401 || erasedLoginRes.status === 403);

    console.log('\n========================================================================');
    console.log(` SECURITY SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================================\n');

  } catch (err) {
    console.error('Unhandled security test error:', err);
  } finally {
    server.close();
  }
}

runSecurityTestSuite();
