-- Add branch_id to qris_settings
ALTER TABLE qris_settings 
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;

-- Add index for faster filtering by branch
CREATE INDEX IF NOT EXISTS idx_qris_settings_branch_id ON qris_settings(branch_id);

-- Update RLS for qris_settings to check branch access (optional, if using RLS)
-- For now, we rely on the application logic filter, but good to add if policy exists.

-- Add settings column to branches for storing booking_fee per branch
ALTER TABLE branches 
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- Comment
COMMENT ON COLUMN branches.settings IS 'Stores branch-specific configurations like booking_fee';
