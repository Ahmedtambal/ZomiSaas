-- =====================================================
-- Change Information Table
-- Stores employee change requests submitted via public forms
-- =====================================================

CREATE TABLE IF NOT EXISTS public.change_information (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  
  -- Organization & Company
  organization_id uuid NOT NULL,
  company_id uuid NOT NULL,
  
  -- Employee identification
  first_name text NOT NULL,
  surname text NOT NULL,
  date_of_birth date NOT NULL,
  
  -- Change details
  date_of_effect date NOT NULL,
  change_type text[] NOT NULL, -- Array to store multiple selections
  other_reason text NULL,
  
  -- Form tracking
  source_form_id uuid NOT NULL,
  submission_token text NULL,
  submitted_via text NOT NULL DEFAULT 'form_link',
  ip_address inet NULL,
  user_agent text NULL,
  
  -- User tracking
  created_by_user_id uuid NULL,
  
  -- Status
  processing_status text NOT NULL DEFAULT 'Pending',
  
  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Primary key
  CONSTRAINT change_information_pkey PRIMARY KEY (id),
  
  -- Foreign keys
  CONSTRAINT change_information_organization_id_fkey 
    FOREIGN KEY (organization_id) 
    REFERENCES organizations(id) 
    ON DELETE CASCADE,
  
  CONSTRAINT change_information_company_id_fkey 
    FOREIGN KEY (company_id) 
    REFERENCES companies(id) 
    ON DELETE CASCADE,
  
  CONSTRAINT change_information_source_form_id_fkey 
    FOREIGN KEY (source_form_id) 
    REFERENCES forms(id) 
    ON DELETE CASCADE,
  
  CONSTRAINT change_information_created_by_user_id_fkey 
    FOREIGN KEY (created_by_user_id) 
    REFERENCES auth.users(id) 
    ON DELETE SET NULL,
  
  -- Check constraints
  CONSTRAINT change_information_change_type_check 
    CHECK (change_type <@ ARRAY[
      'Leaver'::text, 
      'Maternity Leave'::text, 
      'Died'::text, 
      'Change of Name'::text, 
      'Change of Address'::text, 
      'Change of Salary'::text, 
      'Other'::text
    ]),
  
  CONSTRAINT change_information_processing_status_check 
    CHECK (processing_status = ANY(ARRAY[
      'Pending'::text, 
      'Processing'::text, 
      'Completed'::text, 
      'Rejected'::text
    ]))
    
) TABLESPACE pg_default;

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_change_information_organization_id 
  ON public.change_information(organization_id);

CREATE INDEX IF NOT EXISTS idx_change_information_company_id 
  ON public.change_information(company_id);

CREATE INDEX IF NOT EXISTS idx_change_information_created_at 
  ON public.change_information(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_change_information_processing_status 
  ON public.change_information(processing_status);

CREATE INDEX IF NOT EXISTS idx_change_information_change_type 
  ON public.change_information(change_type);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_change_information_updated_at ON change_information;
CREATE TRIGGER update_change_information_updated_at
  BEFORE UPDATE ON change_information
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime();

-- Row Level Security (RLS)
ALTER TABLE public.change_information ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see records from their organization
DROP POLICY IF EXISTS "Users can view their organization's change requests" ON public.change_information;
CREATE POLICY "Users can view their organization's change requests"
  ON public.change_information
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.user_profiles 
      WHERE id = auth.uid()
    )
  );

-- Policy: Users can insert records for their organization
DROP POLICY IF EXISTS "Users can insert change requests for their organization" ON public.change_information;
CREATE POLICY "Users can insert change requests for their organization"
  ON public.change_information
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM public.user_profiles 
      WHERE id = auth.uid()
    )
  );

-- Policy: Users can update records from their organization
DROP POLICY IF EXISTS "Users can update their organization's change requests" ON public.change_information;
CREATE POLICY "Users can update their organization's change requests"
  ON public.change_information
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.user_profiles 
      WHERE id = auth.uid()
    )
  );

-- Policy: Users can delete records from their organization
DROP POLICY IF EXISTS "Users can delete their organization's change requests" ON public.change_information;
CREATE POLICY "Users can delete their organization's change requests"
  ON public.change_information
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.user_profiles 
      WHERE id = auth.uid()
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.change_information TO authenticated;

-- Public can insert via form submissions (no auth required)
GRANT INSERT ON public.change_information TO anon;

-- Comments
COMMENT ON TABLE change_information IS 'Stores employee change requests submitted via public forms';
COMMENT ON COLUMN change_information.change_type IS 'Type of change: Leaver, Maternity Leave, Died, Change of Name, Change of Address, Change of Salary, Other';
COMMENT ON COLUMN change_information.other_reason IS 'Detailed explanation when change_type is "Other"';
COMMENT ON COLUMN change_information.processing_status IS 'Current status: Pending, Processing, Completed, Rejected';
COMMENT ON COLUMN change_information.date_of_effect IS 'Date when the change should take effect';

-- =====================================================
-- DONE! Now you have:
-- ✅ change_information table with all required fields
-- ✅ Foreign keys to organizations, companies, forms
-- ✅ RLS policies for organization-based access
-- ✅ Indexes for performance
-- ✅ Status workflow
-- ✅ Change type validation
-- =====================================================
