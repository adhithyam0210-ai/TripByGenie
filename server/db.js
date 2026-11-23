const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const uuidv4 = () => crypto.randomUUID();
const { seedData } = require('./seedData');

const DB_FILE = path.join(__dirname, 'database.json');

class DatabaseEngine {
  constructor() {
    this.data = {};
    this.init();
  }

  
  init() {
    if (!fs.existsSync(DB_FILE)) {
      console.log('Database file not found. Seeding initial data from seedData...');
      this.data = JSON.parse(JSON.stringify(seedData));
      this.persist();
    } else {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(raw);
        // Ensure all required tables exist
        for (const key of Object.keys(seedData)) {
          if (!this.data[key]) {
            this.data[key] = JSON.parse(JSON.stringify(seedData[key]));
          }
        }
      } catch (err) {
        console.error('Error reading database file, resetting to seed data:', err);
        this.data = JSON.parse(JSON.stringify(seedData));
        this.persist();
      }
    }
  }

  persist() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to persist database:', err);
    }
  }

  checkReload() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const stat = fs.statSync(DB_FILE);
        if (!this.lastMtime || stat.mtimeMs > this.lastMtime) {
          const raw = fs.readFileSync(DB_FILE, 'utf8');
          this.data = JSON.parse(raw);
          this.lastMtime = stat.mtimeMs;
        }
      }
    } catch (e) {
      // ignore
    }
  }

  getTable(table) {
    this.checkReload();
    if (!this.data[table]) {
      this.data[table] = [];
    }
    return this.data[table];
  }

  findAll(table, filterFn = null) {
    const records = this.getTable(table);
    if (!filterFn) return [...records];
    return records.filter(filterFn);
  }

  findById(table, id) {
    const records = this.getTable(table);
    return records.find((item) => String(item.id) === String(id)) || null;
  }

  findOne(table, filterFn) {
    const records = this.getTable(table);
    return records.find(filterFn) || null;
  }

  insert(table, itemData) {
    const records = this.getTable(table);
    const id = itemData.id || `${table.substring(0, 3)}_${uuidv4().replace(/-/g, '').substring(0, 10)}`;
    const now = new Date().toISOString();
    const newRecord = {
      ...itemData,
      id,
      created_at: itemData.created_at || now,
      updated_at: now
    };
    records.push(newRecord);
    this.persist();
    return newRecord;
  }

  update(table, id, updateData) {
    const records = this.getTable(table);
    const index = records.findIndex((item) => String(item.id) === String(id));
    if (index === -1) return null;

    const existing = records[index];
    const updated = {
      ...existing,
      ...updateData,
      id: existing.id, // prevent id change
      updated_at: new Date().toISOString()
    };
    records[index] = updated;
    this.persist();
    return updated;
  }

  delete(table, id) {
    const records = this.getTable(table);
    const index = records.findIndex((item) => String(item.id) === String(id));
    if (index === -1) return false;

    records.splice(index, 1);
    this.persist();
    return true;
  }

  query(table, {
    agency_id = null,
    search = '',
    searchFields = [],
    filters = {},
    sortBy = 'created_at',
    sortOrder = 'desc',
    page = 1,
    limit = 50
  } = {}) {
    let records = this.getTable(table);

    // Filter by agency_id if provided (Tenant Isolation)
    if (agency_id) {
      records = records.filter((r) => r.agency_id === agency_id);
    }

    // Apply strict field filters
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        records = records.filter((r) => String(r[key]) === String(value));
      }
    }

    // Keyword search
    if (search && search.trim() && searchFields.length > 0) {
      const q = search.trim().toLowerCase();
      records = records.filter((item) =>
        searchFields.some((f) => {
          const val = item[f];
          return val && String(val).toLowerCase().includes(q);
        })
      );
    }

    // Sort
    records.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      if (valA === undefined) valA = '';
      if (valB === undefined) valB = '';
      if (typeof valA === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });

    const total = records.length;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.max(1, parseInt(limit, 10) || 50);
    const totalPages = Math.ceil(total / pageSize) || 1;
    const startIndex = (pageNum - 1) * pageSize;
    const paginated = records.slice(startIndex, startIndex + pageSize);

    return {
      data: paginated,
      total,
      page: pageNum,
      limit: pageSize,
      totalPages
    };
  }

  recordActivity(lead_id, user_id, activity_type, description) {
    return this.insert('lead_activities', {
      lead_id,
      user_id,
      activity_type,
      description
    });
  }

  recordAuditLog(agency_id, user_id, action, entity_type, entity_id, details = {}) {
    return this.insert('audit_logs', {
      agency_id: agency_id || 'agency_travel_genie',
      user_id: user_id || 'system',
      action,
      entity_type,
      entity_id,
      details,
      timestamp: new Date().toISOString()
    });
  }

  recordLeadStatusHistory(agency_id, lead_id, from_status, to_status, changed_by, notes = '') {
    return this.insert('lead_status_history', {
      agency_id: agency_id || 'agency_travel_genie',
      lead_id,
      from_status,
      to_status,
      changed_by,
      notes,
      created_at: new Date().toISOString()
    });
  }

  recordBookingStatusHistory(agency_id, booking_id, from_status, to_status, changed_by, notes = '') {
    return this.insert('booking_status_history', {
      agency_id: agency_id || 'agency_travel_genie',
      booking_id,
      from_status,
      to_status,
      changed_by,
      notes,
      created_at: new Date().toISOString()
    });
  }

  logEmail(agency_id, to_email, subject, template_name, status = 'DELIVERED', metadata = {}) {
    return this.insert('email_logs', {
      agency_id: agency_id || 'agency_travel_genie',
      to_email,
      subject,
      template_name,
      status, // DELIVERED, PENDING, FAILED
      metadata: {
        ...metadata,
        // Ensure sensitive credentials are never stored in email logs
        password: metadata.password ? '[REDACTED]' : undefined
      },
      sent_at: new Date().toISOString()
    });
  }

  generateUniqueCode(table, prefix, year = true) {
    const yr = year ? `${new Date().getFullYear()}-` : '';
    const records = this.getTable(table);
    // Count existing records with this prefix
    const count = records.length + 1;
    let code = `${prefix}-${yr}${String(count).padStart(4, '0')}`;
    // Check if code exists, if so increment
    let tries = 0;
    while (records.some(r => r.code === code || r.enquiry_id === code || r.customer_code === code || r.customer_id === code || r.agent_id === code || r.booking_number === code || r.quotation_number === code) && tries < 100) {
      tries++;
      code = `${prefix}-${yr}${String(count + tries).padStart(4, '0')}`;
    }
    return code;
  }

  recordAgentStatusHistory(agent_id, old_status, new_status, changed_by, reason = '') {
    return this.insert('agent_status_history', {
      agent_id,
      old_status,
      new_status,
      changed_by,
      reason,
      created_at: new Date().toISOString()
    });
  }

  recordAgentInvitationHistory(agent_id, action, performed_by, details = {}) {
    return this.insert('agent_invitation_history', {
      agent_id,
      action,
      performed_by,
      details,
      created_at: new Date().toISOString()
    });
  }

  createNotification(agency_id, user_id, title, message, type = 'info', link = '') {
    return this.insert('notifications', {
      agency_id,
      user_id,
      title,
      message,
      type,
      link,
      is_read: false
    });
  }

  // Reset to seed data if ever requested
  resetDatabase() {
    this.data = JSON.parse(JSON.stringify(seedData));
    this.persist();
    return true;
  }
}

const db = new DatabaseEngine();
module.exports = db;
