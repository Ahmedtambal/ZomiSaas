-- =====================================================
-- Zomi Wealth Portal - Initial Database Schema
-- =====================================================
-- This migration creates all core tables for the application
-- Run this first in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: profiles
-- =====================================================
-- User profiles linked to Supabase Auth users
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Admin', 'Member')),
  date_of_birth DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- =====================================================
-- TABLE: invite_codes
-- =====================================================
-- 6-digit invite codes for registration
CREATE TABLE IF NOT EXISTS invite_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE CHECK (code ~ '^[0-9]{6}$'),
  role TEXT NOT NULL CHECK (role IN ('Admin', 'Member')),
  is_used BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  used_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  used_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_is_used ON invite_codes(is_used);

-- =====================================================
-- TABLE: io_upload_members
-- =====================================================
-- Main member database (IO Upload - 35+ fields)
CREATE TABLE IF NOT EXISTS io_upload_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Scheme Reference
  scheme_ref TEXT NOT NULL,
  
  -- Personal Information
  title TEXT,
  forename TEXT NOT NULL,
  surname TEXT NOT NULL,
  ni_number TEXT,
  date_of_birth DATE NOT NULL,
  sex TEXT,
  marital_status TEXT,
  
  -- Address
  address_1 TEXT,
  address_2 TEXT,
  address_3 TEXT,
  address_4 TEXT,
  postcode TEXT,
  uk_resident BOOLEAN,
  nationality TEXT,
  
  -- Employment
  salary NUMERIC(12, 2),
  employment_start_date DATE,
  selected_retirement_age INTEGER,
  section_number TEXT,
  
  -- Pension Information
  pension_investment_approach TEXT,
  category_name TEXT,
  advice_type TEXT NOT NULL,
  selling_adviser_id TEXT NOT NULL,
  
  -- Provider Information
  provider_route TEXT,
  pension_starting_date DATE,
  
  -- Status Tracking
  io_upload_status BOOLEAN DEFAULT FALSE,
  pension_pack BOOLEAN DEFAULT FALSE,
  provider_status BOOLEAN DEFAULT FALSE,
  
  -- Financial Status
  invoiced BOOLEAN DEFAULT FALSE,
  contributions_uploaded BOOLEAN DEFAULT FALSE,
  
  -- Insurance Coverage
  gl_cover BOOLEAN DEFAULT FALSE,
  gip_cover BOOLEAN DEFAULT FALSE,
  gci_cover BOOLEAN DEFAULT FALSE,
  bupa_cover BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_io_members_scheme_ref ON io_upload_members(scheme_ref);
CREATE INDEX IF NOT EXISTS idx_io_members_surname ON io_upload_members(surname);
CREATE INDEX IF NOT EXISTS idx_io_members_created_at ON io_upload_members(created_at);

-- =====================================================
-- TABLE: new_employee_members
-- =====================================================
-- New employee onboarding database (20 fields)
CREATE TABLE IF NOT EXISTS new_employee_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Personal Information
  title TEXT,
  forename TEXT NOT NULL,
  surname TEXT NOT NULL,
  ni_number TEXT,
  date_of_birth DATE NOT NULL,
  sex TEXT,
  marital_status TEXT,
  
  -- Address
  address_1 TEXT,
  address_2 TEXT,
  address_3 TEXT,
  address_4 TEXT,
  postcode TEXT,
  uk_resident BOOLEAN,
  nationality TEXT,
  
  -- Employment
  salary NUMERIC(12, 2),
  employment_start_date DATE,
  selected_retirement_age INTEGER,
  section_number TEXT,
  
  -- Pension
  pension_investment_approach TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_new_employee_surname ON new_employee_members(surname);
CREATE INDEX IF NOT EXISTS idx_new_employee_created_at ON new_employee_members(created_at);

-- =====================================================
-- TABLE: form_definitions
-- =====================================================
-- Dynamic form builder configurations
CREATE TABLE IF NOT EXISTS form_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  fields JSONB NOT NULL, -- Array of FormField objects
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_form_definitions_active ON form_definitions(is_active);
CREATE INDEX IF NOT EXISTS idx_form_definitions_created_by ON form_definitions(created_by);

-- =====================================================
-- TABLE: form_submissions
-- =====================================================
-- Form submission data
CREATE TABLE IF NOT EXISTS form_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id UUID NOT NULL REFERENCES form_definitions(id) ON DELETE CASCADE,
  data JSONB NOT NULL, -- Submitted form data
  ip_address INET,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_id ON form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_submitted_at ON form_submissions(submitted_at);

-- =====================================================
-- TABLE: form_links
-- =====================================================
-- Public form links with expiration
CREATE TABLE IF NOT EXISTS form_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id UUID NOT NULL REFERENCES form_definitions(id) ON DELETE CASCADE,
  url TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  access_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_form_links_form_id ON form_links(form_id);
CREATE INDEX IF NOT EXISTS idx_form_links_url ON form_links(url);
CREATE INDEX IF NOT EXISTS idx_form_links_active ON form_links(is_active);

-- =====================================================
-- TABLE: app_config
-- =====================================================
-- System configuration (nationalities, marital statuses, etc.)
CREATE TABLE IF NOT EXISTS app_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE, -- e.g., 'nationalities', 'marital_statuses'
  values JSONB NOT NULL, -- Array of strings
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_app_config_key ON app_config(key);

-- =====================================================
-- TABLE: audit_logs
-- =====================================================
-- Audit trail for all data changes
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- =====================================================
-- FUNCTIONS: Auto-update timestamps
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_io_members_updated_at BEFORE UPDATE ON io_upload_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_new_employee_updated_at BEFORE UPDATE ON new_employee_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_form_definitions_updated_at BEFORE UPDATE ON form_definitions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_config_updated_at BEFORE UPDATE ON app_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION: Create profile on auth signup
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'Member')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- Insert default app config
-- =====================================================
INSERT INTO app_config (key, values) VALUES
  ('nationalities', '["British", "Irish", "Other EU", "Non-EU"]'::jsonb),
  ('marital_statuses', '["Single", "Married", "Divorced", "Widowed", "Civil Partnership"]'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Initial schema created successfully!';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Run 002_rls_policies.sql for Row Level Security';
  RAISE NOTICE '2. Run 003_functions.sql for helper functions';
  RAISE NOTICE '3. Generate your first admin invite code';
END $$;