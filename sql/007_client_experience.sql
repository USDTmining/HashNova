-- Edge Nexus Phase 8: client experience / KYC / activity endpoints support
ALTER TABLE kyc_profiles ADD COLUMN IF NOT EXISTS country_code TEXT;
ALTER TABLE kyc_profiles ADD COLUMN IF NOT EXISTS document_type TEXT;
ALTER TABLE kyc_profiles ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_kyc_status ON kyc_profiles(status);
