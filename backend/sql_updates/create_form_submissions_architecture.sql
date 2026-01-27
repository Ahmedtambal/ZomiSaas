-- =====================================================
-- Form Submissions Architecture - Option 4
-- Separates form structure from submission data
-- =====================================================

-- =====================================================
-- 1. Update FORMS table - Add new columns for templates, versioning, tagging
-- =====================================================
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS version integer DEFAULT 1;
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS is_template boolean DEFAULT false;
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS parent_form_id uuid NULL;
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS duplicate_count integer DEFAULT 0;

-- Add constraint for parent_form_id
ALTER TABLE public.forms 
ADD CONSTRAINT forms_parent_form_id_fkey 
FOREIGN KEY (parent_form_id) REFERENCES forms(id) ON DELETE SET NULL;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_forms_is_template ON public.forms(is_template);
CREATE INDEX IF NOT EXISTS idx_forms_tags ON public.forms USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_forms_parent_form_id ON public.forms(parent_form_id);

COMMENT ON COLUMN forms.version IS 'Current version number of the form';
COMMENT ON COLUMN forms.is_template IS 'True if this form is a reusable template';
COMMENT ON COLUMN forms.tags IS 'Array of tags for categorization';
COMMENT ON COLUMN forms.parent_form_id IS 'Reference to original form if this is a duplicate';
COMMENT ON COLUMN forms.duplicate_count IS 'Number of times this form has been duplicated';


-- =====================================================
-- 2. Create FORM_VERSIONS table - Track form history
-- =====================================================
CREATE TABLE IF NOT EXISTS public.form_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL,
  version_number integer NOT NULL,
  form_data_snapshot jsonb NOT NULL,
  change_notes text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by_user_id uuid NULL,
  
  CONSTRAINT form_versions_pkey PRIMARY KEY (id),
  CONSTRAINT form_versions_form_id_fkey FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE,
  CONSTRAINT form_versions_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT form_versions_unique_version UNIQUE (form_id, version_number)
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_form_versions_form_id ON public.form_versions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_versions_created_at ON public.form_versions(created_at DESC);

COMMENT ON TABLE form_versions IS 'Stores historical versions of form structures';
COMMENT ON COLUMN form_versions.form_data_snapshot IS 'Complete snapshot of form structure at this version';


-- =====================================================
-- 3. Create FORM_SUBMISSIONS table - Separate submission data
-- =====================================================
CREATE TABLE IF NOT EXISTS public.form_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL,
  form_version integer NOT NULL DEFAULT 1,
  submission_data jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  
  -- Tracking
  submitted_at timestamp with time zone NOT NULL DEFAULT now(),
  submitted_by_user_id uuid NULL,
  submitted_via text NULL DEFAULT 'form_link',
  token_id uuid NULL,
  
  -- Related entities
  organization_id uuid NOT NULL,
  company_id uuid NULL,
  employee_id uuid NULL,
  
  -- Network info
  ip_address inet NULL,
  user_agent text NULL,
  
  -- Metadata
  notes text NULL,
  reviewed_at timestamp with time zone NULL,
  reviewed_by_user_id uuid NULL,
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT form_submissions_pkey PRIMARY KEY (id),
  CONSTRAINT form_submissions_form_id_fkey FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE,
  CONSTRAINT form_submissions_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT form_submissions_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL,
  CONSTRAINT form_submissions_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL,
  CONSTRAINT form_submissions_token_id_fkey FOREIGN KEY (token_id) REFERENCES form_tokens(id) ON DELETE SET NULL,
  CONSTRAINT form_submissions_status_check CHECK (status = ANY(ARRAY['pending'::text, 'reviewing'::text, 'approved'::text, 'rejected'::text, 'completed'::text]))
) TABLESPACE pg_default;

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_id ON public.form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_status ON public.form_submissions(status);
CREATE INDEX IF NOT EXISTS idx_form_submissions_submitted_at ON public.form_submissions(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_form_submissions_organization_id ON public.form_submissions(organization_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_company_id ON public.form_submissions(company_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_employee_id ON public.form_submissions(employee_id);

-- Trigger for updated_at
CREATE TRIGGER update_form_submissions_updated_at
BEFORE UPDATE ON form_submissions
FOR EACH ROW
EXECUTE FUNCTION moddatetime();

COMMENT ON TABLE form_submissions IS 'Stores individual form submissions separately from form structure';
COMMENT ON COLUMN form_submissions.status IS 'Submission workflow status: pending, reviewing, approved, rejected, completed';


-- =====================================================
-- 4. Update FORM_TOKENS table - Add analytics
-- =====================================================
ALTER TABLE public.form_tokens ADD COLUMN IF NOT EXISTS analytics jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.form_tokens ADD COLUMN IF NOT EXISTS settings jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.form_tokens ADD COLUMN IF NOT EXISTS name text NULL;
ALTER TABLE public.form_tokens ADD COLUMN IF NOT EXISTS deactivated_at timestamp with time zone NULL;
ALTER TABLE public.form_tokens ADD COLUMN IF NOT EXISTS deactivated_by_user_id uuid NULL;

COMMENT ON COLUMN form_tokens.analytics IS 'Click tracking, completion rate, and other metrics';
COMMENT ON COLUMN form_tokens.settings IS 'Link-specific settings (notifications, redirect URL, etc.)';
COMMENT ON COLUMN form_tokens.name IS 'Friendly name for this link (e.g., "Client Portal Link", "HR Department")';


-- =====================================================
-- 5. Create FORM_SECTIONS table - Field grouping
-- =====================================================
CREATE TABLE IF NOT EXISTS public.form_sections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL,
  section_name text NOT NULL,
  section_order integer NOT NULL DEFAULT 0,
  description text NULL,
  is_collapsible boolean DEFAULT false,
  is_collapsed_by_default boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT form_sections_pkey PRIMARY KEY (id),
  CONSTRAINT form_sections_form_id_fkey FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_form_sections_form_id ON public.form_sections(form_id);

COMMENT ON TABLE form_sections IS 'Organizes form fields into logical sections/groups';


-- =====================================================
-- 6. Grant permissions
-- =====================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.form_versions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.form_submissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.form_sections TO authenticated;

-- Public can insert submissions via public forms
GRANT SELECT, INSERT ON public.form_submissions TO anon;


-- =====================================================
-- 7. Create helper functions
-- =====================================================

-- Function to automatically create version snapshot when form is updated
CREATE OR REPLACE FUNCTION create_form_version_on_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create version if form_data actually changed
  IF OLD.form_data IS DISTINCT FROM NEW.form_data THEN
    INSERT INTO form_versions (
      form_id,
      version_number,
      form_data_snapshot,
      created_by_user_id,
      change_notes
    ) VALUES (
      NEW.id,
      NEW.version,
      OLD.form_data,  -- Store the OLD version before update
      NEW.created_by_user_id,
      'Auto-saved version ' || NEW.version
    );
    
    -- Increment version number
    NEW.version = NEW.version + 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to forms table
DROP TRIGGER IF EXISTS trigger_create_form_version ON public.forms;
CREATE TRIGGER trigger_create_form_version
BEFORE UPDATE ON public.forms
FOR EACH ROW
EXECUTE FUNCTION create_form_version_on_update();


-- Function to increment duplicate_count when form is duplicated
CREATE OR REPLACE FUNCTION increment_duplicate_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_form_id IS NOT NULL THEN
    UPDATE forms 
    SET duplicate_count = duplicate_count + 1 
    WHERE id = NEW.parent_form_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger
DROP TRIGGER IF EXISTS trigger_increment_duplicate_count ON public.forms;
CREATE TRIGGER trigger_increment_duplicate_count
AFTER INSERT ON public.forms
FOR EACH ROW
EXECUTE FUNCTION increment_duplicate_count();


-- =====================================================
-- 8. Migrate existing data
-- =====================================================

-- Mark New Employee Upload as template
UPDATE public.forms 
SET is_template = true, 
    tags = ARRAY['employee', 'onboarding', 'hr']
WHERE template_type = 'new_employee_upload';

-- Create initial version snapshots for existing forms
INSERT INTO form_versions (form_id, version_number, form_data_snapshot, created_by_user_id)
SELECT 
  id,
  1,
  form_data,
  created_by_user_id
FROM forms
WHERE NOT EXISTS (
  SELECT 1 FROM form_versions WHERE form_versions.form_id = forms.id
);


-- =====================================================
-- DONE! Now you have:
-- ✅ Separate submissions table
-- ✅ Form versioning with automatic snapshots
-- ✅ Template system with tagging
-- ✅ Form duplication tracking
-- ✅ Link analytics
-- ✅ Field sections/groups
-- ✅ Submission workflow (status)
-- =====================================================
