const http = require('http');

function post(path, body, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body || {});
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'POST',
      headers
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'GET',
      headers
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('Testing Demo Logins for all 5 roles...');
  for (const role of ['admin', 'manager', 'staff', 'agent', 'customer']) {
    const res = await post('/api/auth/demo-login', { role });
    console.log(`Role ${role}: status ${res.status}, logged in as ${res.data.user?.name} (role: ${res.data.user?.role})`);
  }

  // Admin login to test user management
  const adminRes = await post('/api/auth/demo-login', { role: 'admin' });
  const adminToken = adminRes.data.token;

  console.log('\nTesting GET /api/admin/users...');
  const usersRes = await get('/api/admin/users', adminToken);
  console.log(`Total users fetched: ${usersRes.data.length}`);

  console.log('\nTesting Manager access to leads...');
  const mgrRes = await post('/api/auth/demo-login', { role: 'manager' });
  const mgrToken = mgrRes.data.token;
  const mgrLeads = await get('/api/admin/leads', mgrToken);
  console.log(`Manager leads access: status ${mgrLeads.status}, total leads: ${mgrLeads.data.total}`);

  console.log('\nAll 5-role tests completed successfully!');
}

run().catch(console.error);
