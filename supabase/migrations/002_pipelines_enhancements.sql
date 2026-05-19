-- ============================================================
-- Pipeline enhancements:
--   * crm_deals.assigned_to — optional FK to profiles.id
--   * crm_deals.status — CHECK constraint ('open', 'won', 'lost')
--     (replaces the old default 'active' with spec-compliant values)
--
-- Idempotent: safe to run multiple times.
-- ============================================================

-- Add assigned_to (nullable, FK to profiles)
ALTER TABLE crm_deals
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_deals_assigned_to ON crm_deals(assigned_to);

-- Normalize status values: any existing 'active' row becomes 'open'
UPDATE crm_deals SET status = 'open' WHERE status = 'active' OR status IS NULL;

-- Replace the old default and enforce allowed values
ALTER TABLE crm_deals ALTER COLUMN status SET DEFAULT 'open';

-- Drop prior CHECK if any (none in 001, but be idempotent)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'deals_status_check' AND conrelid = 'crm_deals'::regclass
  ) THEN
    ALTER TABLE crm_deals DROP CONSTRAINT deals_status_check;
  END IF;
END $$;

ALTER TABLE crm_deals
  ADD CONSTRAINT deals_status_check CHECK (status IN ('open', 'won', 'lost'));
