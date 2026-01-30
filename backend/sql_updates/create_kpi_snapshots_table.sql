-- Create KPI snapshots table for historical trend tracking
-- This table stores daily snapshots of all KPI metrics

CREATE TABLE IF NOT EXISTS public.kpi_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    snapshot_date DATE NOT NULL,
    
    -- Workforce metrics
    total_active_employees INTEGER DEFAULT 0,
    average_pensionable_salary NUMERIC(12, 2) DEFAULT 0,
    total_salary_under_management NUMERIC(15, 2) DEFAULT 0,
    pending_pension_activations INTEGER DEFAULT 0,
    
    -- Coverage metrics
    pension_participation_rate NUMERIC(5, 2) DEFAULT 0,
    group_life_coverage_rate NUMERIC(5, 2) DEFAULT 0,
    gci_coverage_rate NUMERIC(5, 2) DEFAULT 0,
    gip_coverage_rate NUMERIC(5, 2) DEFAULT 0,
    bupa_coverage_rate NUMERIC(5, 2) DEFAULT 0,
    
    -- Demographics metrics
    gender_male_count INTEGER DEFAULT 0,
    gender_female_count INTEGER DEFAULT 0,
    gender_other_count INTEGER DEFAULT 0,
    uk_resident_count INTEGER DEFAULT 0,
    non_uk_resident_count INTEGER DEFAULT 0,
    
    -- Additional metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_org_snapshot_date UNIQUE(organization_id, snapshot_date)
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_kpi_snapshots_org_date 
ON public.kpi_snapshots(organization_id, snapshot_date DESC);

CREATE INDEX IF NOT EXISTS idx_kpi_snapshots_date 
ON public.kpi_snapshots(snapshot_date DESC);

-- Enable Row Level Security
ALTER TABLE public.kpi_snapshots ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for organization isolation
CREATE POLICY kpi_snapshots_org_isolation ON public.kpi_snapshots
    FOR ALL
    USING (organization_id = auth.uid());

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.kpi_snapshots TO authenticated;
GRANT SELECT ON public.kpi_snapshots TO anon;

-- Add comment
COMMENT ON TABLE public.kpi_snapshots IS 'Daily snapshots of KPI metrics for trend tracking and historical analysis';
