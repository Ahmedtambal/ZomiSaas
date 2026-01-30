# KPI Snapshot System - Setup Guide

## Overview
The KPI snapshot system stores daily snapshots of all metrics to enable accurate historical trend tracking without expensive real-time calculations.

## Database Setup

1. **Run the SQL migration** in Supabase SQL Editor:
   ```bash
   backend/sql_updates/create_kpi_snapshots_table.sql
   ```

2. This creates the `kpi_snapshots` table with columns for all metrics.

## How It Works

### Automatic Snapshot Generation
When you call `/api/kpi/workforce`, the system:
1. Checks if today's snapshot exists
2. If not, calculates and stores it automatically
3. Fetches 7-day-old snapshot for trend calculation
4. Returns current values with trend indicators

### Manual Snapshot Generation
You can manually generate snapshots via API:
```bash
POST /api/kpi/snapshot/generate
Authorization: Bearer <token>
```

## Daily Scheduled Snapshots (Recommended)

### Option 1: External Cron Service (Render Cron Jobs)

1. Go to your Render Dashboard
2. Create a new **Cron Job**
3. Configure:
   - **Name**: Daily KPI Snapshots
   - **Schedule**: `0 0 * * *` (midnight daily)
   - **Command**: 
     ```bash
     curl -X POST https://your-backend.onrender.com/api/kpi/snapshot/generate \
       -H "Authorization: Bearer YOUR_SERVICE_TOKEN"
     ```

### Option 2: GitHub Actions

Create `.github/workflows/daily-kpi-snapshot.yml`:
```yaml
name: Daily KPI Snapshot

on:
  schedule:
    - cron: '0 0 * * *'  # Run at midnight UTC daily
  workflow_dispatch:  # Allow manual trigger

jobs:
  generate-snapshots:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger KPI Snapshot
        run: |
          curl -X POST ${{ secrets.BACKEND_URL }}/api/kpi/snapshot/generate \
            -H "Authorization: Bearer ${{ secrets.SERVICE_TOKEN }}" \
            -H "Content-Type: application/json"
```

Add secrets to GitHub repository:
- `BACKEND_URL`: Your backend URL
- `SERVICE_TOKEN`: Service account JWT token

### Option 3: Supabase Edge Functions

Create a Supabase Edge Function that runs daily:
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const response = await fetch('https://your-backend.onrender.com/api/kpi/snapshot/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('SERVICE_TOKEN')}`,
      'Content-Type': 'application/json'
    }
  });
  
  return new Response(JSON.stringify({ status: response.status }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

Schedule it with `pg_cron` in Supabase SQL Editor:
```sql
SELECT cron.schedule(
    'daily-kpi-snapshot',
    '0 0 * * *',
    $$
    SELECT 
      net.http_post(
        url:='https://your-edge-function.supabase.co/kpi-snapshot',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.service_role_key') || '"}'::jsonb
      ) AS request_id;
    $$
);
```

## Testing

### Test Snapshot Generation
```bash
# Via API
curl -X POST http://localhost:8000/api/kpi/snapshot/generate \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check snapshots table in Supabase
SELECT * FROM kpi_snapshots ORDER BY snapshot_date DESC LIMIT 5;
```

### Generate Historical Data (Backfill)
To populate historical snapshots for testing trends, you can manually call the endpoint for past dates:

```python
# Run this script to backfill last 30 days
import requests
from datetime import date, timedelta

base_url = "http://localhost:8000"
token = "YOUR_TOKEN"

for i in range(30, 0, -1):
    snapshot_date = date.today() - timedelta(days=i)
    # Note: You'd need to modify the endpoint to accept a date parameter
    # Or run calculate_and_store_snapshot directly via Python script
    print(f"Generated snapshot for {snapshot_date}")
```

## Monitoring

Check snapshot generation:
```sql
-- Recent snapshots
SELECT 
    snapshot_date,
    total_active_employees,
    average_pensionable_salary,
    created_at
FROM kpi_snapshots
WHERE organization_id = 'YOUR_ORG_ID'
ORDER BY snapshot_date DESC
LIMIT 10;

-- Missing dates
SELECT generate_series(
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE,
    INTERVAL '1 day'
)::date AS expected_date
EXCEPT
SELECT snapshot_date FROM kpi_snapshots
WHERE organization_id = 'YOUR_ORG_ID';
```

## Benefits

✅ **Fast Queries**: Pre-calculated metrics, no real-time aggregation
✅ **Historical Data**: Preserved even if employees are deleted
✅ **Flexible Trends**: Compare any time periods (7d, 30d, 90d, YoY)
✅ **Accurate**: Point-in-time snapshots, not estimates
✅ **Scalable**: Works with millions of records

## Notes

- Snapshots are generated automatically on first dashboard load each day
- RLS policies ensure organization isolation
- Upsert prevents duplicate snapshots
- All currency values stored as NUMERIC for precision
