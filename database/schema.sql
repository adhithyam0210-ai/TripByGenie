-- ==============================================================================
-- PROJECT: TRIPBYGENIE (TRAVEL & TOURS MANAGEMENT PLATFORM)
-- RELATIONAL DATABASE DDL SPECIFICATION (PostgreSQL 14+)
-- Architecture: 3NF Normalized, Strict Foreign Keys, Audit Timestamps, GIN Indexes
-- ==============================================================================

-- Enable UUID extension for robust distributed primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. ENUMS (Custom Relational Types for Domain Integrity)
-- ==============================================================================

CREATE TYPE user_role AS ENUM (
    'CUSTOMER',
    'ADMIN',
    'STAFF',
    'AGENT'
);

CREATE TYPE lead_pipeline_stage AS ENUM (
    'NEW',
    'ASSIGNED',
    'CONTACTED',
    'QUOTE_SENT',
    'NEGOTIATING',
    'CONVERTED',
    'LOST'
);

CREATE TYPE interaction_channel AS ENUM (
    'CALL',
    'WHATSAPP',
    'EMAIL',
    'NOTE'
);

CREATE TYPE order_payment_status AS ENUM (
    'PENDING',
    'PAID',
    'FAILED',
    'REFUNDED'
);

-- ==============================================================================
-- 2. CORE AUDIT TRIGGER (Automatically maintains updated_at across all tables)
-- ==============================================================================

CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 3. TABLE: users
-- Unified Identity & Access Management for all 4 roles
-- ==============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_code VARCHAR(32) NOT NULL UNIQUE, -- e.g. 'ADM-1001', 'STF-1001', 'AGT-1001', 'CUS-1001'
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(30),
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'CUSTOMER',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_code ON users(user_code);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_by ON users(created_by);

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

-- ==============================================================================
-- 4. TABLE: packages
-- Tour Packages with Dual Pricing Model: B2C Public MSRP vs B2B Wholesale Rate
-- ==============================================================================

CREATE TABLE packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(255) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    destination VARCHAR(150) NOT NULL,
    duration_days INT NOT NULL CHECK (duration_days > 0),
    duration_nights INT NOT NULL CHECK (duration_nights >= 0),
    b2c_price NUMERIC(12, 2) NOT NULL CHECK (b2c_price >= 0),
    b2b_offer_price NUMERIC(12, 2) NOT NULL CHECK (b2b_offer_price >= 0),
    itinerary_details JSONB NOT NULL DEFAULT '[]'::jsonb,
    inclusions JSONB NOT NULL DEFAULT '[]'::jsonb,
    exclusions JSONB NOT NULL DEFAULT '[]'::jsonb,
    cover_image VARCHAR(512),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_package_b2b_rate CHECK (b2b_offer_price <= b2c_price)
);

CREATE INDEX idx_packages_slug ON packages(slug);
CREATE INDEX idx_packages_destination ON packages(destination);
CREATE INDEX idx_packages_is_active ON packages(is_active);
CREATE INDEX idx_packages_itinerary_gin ON packages USING GIN (itinerary_details);

CREATE TRIGGER trg_packages_updated_at
BEFORE UPDATE ON packages
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

-- ==============================================================================
-- 5. TABLE: hero_banners
-- Dynamic Landing Page CMS (Admin Managed)
-- ==============================================================================

CREATE TABLE hero_banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    subtitle TEXT,
    media_url VARCHAR(512) NOT NULL,
    cta_package_id UUID REFERENCES packages(id) ON DELETE SET NULL,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_hero_banners_order ON hero_banners(display_order ASC) WHERE is_active = TRUE;

CREATE TRIGGER trg_hero_banners_updated_at
BEFORE UPDATE ON hero_banners
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

-- ==============================================================================
-- 6. TABLE: crm_leads
-- Sales & Lead Pipeline (Atomic Generation on Sign-up / Package Inquiry)
-- ==============================================================================

CREATE TABLE crm_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    package_id UUID NOT NULL REFERENCES packages(id) ON DELETE RESTRICT,
    assigned_staff_id UUID REFERENCES users(id) ON DELETE SET NULL,
    travel_date DATE,
    pax_count INT NOT NULL DEFAULT 2 CHECK (pax_count > 0),
    pipeline_stage lead_pipeline_stage NOT NULL DEFAULT 'NEW',
    quoted_price NUMERIC(12, 2) CHECK (quoted_price IS NULL OR quoted_price >= 0),
    next_followup_at TIMESTAMPTZ,
    source VARCHAR(100) NOT NULL DEFAULT 'WEBSITE_ENQUIRY',
    customer_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Compound Index for Staff Queue Lookups
CREATE INDEX idx_crm_leads_staff_stage ON crm_leads(assigned_staff_id, pipeline_stage);

-- Index for Unassigned / New Leads in Admin Dashboard
CREATE INDEX idx_crm_leads_stage_created ON crm_leads(pipeline_stage, created_at DESC);

-- Customer Inquiries History Index
CREATE INDEX idx_crm_leads_customer ON crm_leads(customer_id);

-- Followup Reminder Index
CREATE INDEX idx_crm_leads_followup ON crm_leads(next_followup_at) WHERE next_followup_at IS NOT NULL;

CREATE TRIGGER trg_crm_leads_updated_at
BEFORE UPDATE ON crm_leads
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

-- ==============================================================================
-- 7. TABLE: lead_interactions
-- Historical Audit Log of Staff-Customer Communications
-- ==============================================================================

CREATE TABLE lead_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    channel interaction_channel NOT NULL,
    summary TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lead_interactions_lead_created ON lead_interactions(lead_id, created_at DESC);
CREATE INDEX idx_lead_interactions_staff ON lead_interactions(staff_id);

-- ==============================================================================
-- 8. TABLE: agent_orders
-- B2B Wholesale Reseller Orders & Markup Profit Ledger
-- ==============================================================================

CREATE TABLE agent_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(64) NOT NULL UNIQUE, -- e.g. 'ORD-2026-78901'
    agent_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    package_id UUID NOT NULL REFERENCES packages(id) ON DELETE RESTRICT,
    pax_count INT NOT NULL CHECK (pax_count > 0),
    traveler_details JSONB NOT NULL DEFAULT '[]'::jsonb,
    b2b_unit_cost NUMERIC(12, 2) NOT NULL CHECK (b2b_unit_cost >= 0), -- Snapshot of offer price at order time
    total_wholesale_cost NUMERIC(12, 2) NOT NULL CHECK (total_wholesale_cost >= 0),
    agent_selling_price NUMERIC(12, 2) NOT NULL CHECK (agent_selling_price >= total_wholesale_cost),
    agent_profit NUMERIC(12, 2) NOT NULL CHECK (agent_profit >= 0),
    payment_status order_payment_status NOT NULL DEFAULT 'PENDING',
    payment_gateway_ref VARCHAR(255),
    idempotency_key VARCHAR(128) UNIQUE,
    voucher_issued BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_agent_orders_agent ON agent_orders(agent_id, created_at DESC);
CREATE INDEX idx_agent_orders_payment_status ON agent_orders(payment_status);
CREATE INDEX idx_agent_orders_idempotency ON agent_orders(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX idx_agent_orders_travelers_gin ON agent_orders USING GIN (traveler_details);

CREATE TRIGGER trg_agent_orders_updated_at
BEFORE UPDATE ON agent_orders
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

-- ==============================================================================
-- 9. TABLE: enquiries
-- Universal Landing Page Customer Inquiries
-- ==============================================================================
CREATE TABLE IF NOT EXISTS enquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enquiry_id VARCHAR(32) NOT NULL UNIQUE, -- e.g. 'ENQ-2026-0001'
    customer_name VARCHAR(150) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(30) NOT NULL,
    country VARCHAR(100) DEFAULT 'India',
    departure_city VARCHAR(100),
    destination VARCHAR(150) NOT NULL,
    package_id VARCHAR(64),
    departure_date DATE,
    return_date DATE,
    adults INT DEFAULT 2,
    children INT DEFAULT 0,
    infants INT DEFAULT 0,
    budget VARCHAR(100),
    travel_type VARCHAR(100),
    special_requirements TEXT,
    additional_message TEXT,
    source VARCHAR(100) DEFAULT 'Universal Landing Page',
    campaign_source VARCHAR(255),
    status VARCHAR(50) DEFAULT 'NEW',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_enquiries_enquiry_id ON enquiries(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_customer_email ON enquiries(customer_email);
CREATE INDEX IF NOT EXISTS idx_enquiries_status ON enquiries(status);

-- ==============================================================================
-- 10. TABLE: customer_account_invitations
-- Single-use Secure Tokens for Customer Onboarding & Password Creation
-- ==============================================================================
CREATE TABLE IF NOT EXISTS customer_account_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id VARCHAR(64) NOT NULL, -- e.g. 'CUS-2026-0001'
    booking_id VARCHAR(64) NOT NULL,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    used_at TIMESTAMPTZ,
    created_by VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invitations_token ON customer_account_invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON customer_account_invitations(email);

-- ==============================================================================
-- 11. TABLE: email_logs
-- Audit Log of All Outbound Transactional Communications
-- ==============================================================================
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id VARCHAR(64) DEFAULT 'agency_travel_genie',
    to_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    template_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'DELIVERED',
    metadata JSONB DEFAULT '{}'::jsonb,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_logs_to ON email_logs(to_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_template ON email_logs(template_name);

-- ==============================================================================
-- 12. TABLE: b2b_agents
-- Wholesale Travel Partner Agency Master Record
-- ==============================================================================
CREATE TABLE IF NOT EXISTS b2b_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id VARCHAR(32) NOT NULL UNIQUE, -- e.g. 'B2B-2026-0001'
    user_id VARCHAR(64) NOT NULL,
    agency_id VARCHAR(64) NOT NULL DEFAULT 'agency_travel_genie',
    agent_name VARCHAR(150) NOT NULL,
    company_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(30) NOT NULL,
    business_address TEXT,
    gst_number VARCHAR(50),
    business_reg_number VARCHAR(50),
    contact_person VARCHAR(150),
    account_type VARCHAR(50) NOT NULL DEFAULT 'WHOLESALE',
    account_status VARCHAR(50) NOT NULL DEFAULT 'INVITATION_PENDING',
    invitation_status VARCHAR(50) NOT NULL DEFAULT 'INVITATION_SENT',
    wholesale_discount_pct NUMERIC(5, 2) NOT NULL DEFAULT 12.00,
    credit_limit NUMERIC(12, 2) NOT NULL DEFAULT 500000.00,
    invitation_sent_at TIMESTAMPTZ,
    activated_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_b2b_agents_agent_id ON b2b_agents(agent_id);
CREATE INDEX IF NOT EXISTS idx_b2b_agents_email ON b2b_agents(email);
CREATE INDEX IF NOT EXISTS idx_b2b_agents_status ON b2b_agents(account_status);

-- ==============================================================================
-- 13. TABLE: agent_account_invitations
-- Single-use Secure Tokens for B2B Agent Onboarding & Password Creation
-- ==============================================================================
CREATE TABLE IF NOT EXISTS agent_account_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id VARCHAR(32) NOT NULL, -- e.g. 'B2B-2026-0001'
    b2b_agent_id VARCHAR(64),
    user_id VARCHAR(64) NOT NULL,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    used_at TIMESTAMPTZ,
    created_by VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agent_invitations_token ON agent_account_invitations(token);
CREATE INDEX IF NOT EXISTS idx_agent_invitations_agent_id ON agent_account_invitations(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_invitations_email ON agent_account_invitations(email);

-- ==============================================================================
-- 14. TABLE: agent_invitation_history
-- Audit Log of B2B Agent Invitations & Lifecycle Events
-- ==============================================================================
CREATE TABLE IF NOT EXISTS agent_invitation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id VARCHAR(32) NOT NULL,
    action VARCHAR(50) NOT NULL, -- INVITATION_CREATED, INVITATION_SENT, INVITATION_RESENT, ACCOUNT_ACTIVATED
    performed_by VARCHAR(64) NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agent_invitation_history_agent ON agent_invitation_history(agent_id);

-- ==============================================================================
-- 15. TABLE: agent_status_history
-- Audit Log of Agent Account Status Changes (Active, Suspended, Inactive)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS agent_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id VARCHAR(32) NOT NULL,
    old_status VARCHAR(50) NOT NULL,
    new_status VARCHAR(50) NOT NULL,
    changed_by VARCHAR(64) NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agent_status_history_agent ON agent_status_history(agent_id);

