-- Migration to add support for multiple vehicles in contracts
-- Create contract_vehicles junction table for many-to-many relationship

-- First, create the contract_vehicles table
CREATE TABLE IF NOT EXISTS contract_vehicles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    daily_rate DECIMAL(10,2), -- Allow different rates per vehicle if needed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique combination of contract and vehicle
    UNIQUE(contract_id, vehicle_id)
);

-- Add RLS (Row Level Security) policies
ALTER TABLE contract_vehicles ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to see contract_vehicles from their tenant
CREATE POLICY "Users can view contract_vehicles from their tenant" ON contract_vehicles
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM employees 
            WHERE id = auth.uid()
        )
    );

-- Policy for authenticated users to insert contract_vehicles for their tenant
CREATE POLICY "Users can insert contract_vehicles for their tenant" ON contract_vehicles
    FOR INSERT WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM employees 
            WHERE id = auth.uid()
        )
    );

-- Policy for authenticated users to update contract_vehicles from their tenant
CREATE POLICY "Users can update contract_vehicles from their tenant" ON contract_vehicles
    FOR UPDATE USING (
        tenant_id IN (
            SELECT tenant_id FROM employees 
            WHERE id = auth.uid()
        )
    );

-- Policy for authenticated users to delete contract_vehicles from their tenant
CREATE POLICY "Users can delete contract_vehicles from their tenant" ON contract_vehicles
    FOR DELETE USING (
        tenant_id IN (
            SELECT tenant_id FROM employees 
            WHERE id = auth.uid()
        )
    );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contract_vehicles_contract_id ON contract_vehicles(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_vehicles_vehicle_id ON contract_vehicles(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_contract_vehicles_tenant_id ON contract_vehicles(tenant_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_contract_vehicles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contract_vehicles_updated_at
    BEFORE UPDATE ON contract_vehicles
    FOR EACH ROW
    EXECUTE FUNCTION update_contract_vehicles_updated_at();

-- Migrate existing contracts to use the new structure
-- For each existing contract, create a contract_vehicles entry
INSERT INTO contract_vehicles (tenant_id, contract_id, vehicle_id, daily_rate, created_at, updated_at)
SELECT 
    c.tenant_id,
    c.id as contract_id,
    c.vehicle_id,
    c.daily_rate,
    c.created_at,
    c.updated_at
FROM contracts c
WHERE c.vehicle_id IS NOT NULL
ON CONFLICT (contract_id, vehicle_id) DO NOTHING;

-- Add a new column to track if contract uses multiple vehicles
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS uses_multiple_vehicles BOOLEAN DEFAULT FALSE;

-- Update existing contracts that now have entries in contract_vehicles
UPDATE contracts 
SET uses_multiple_vehicles = TRUE 
WHERE id IN (
    SELECT DISTINCT contract_id 
    FROM contract_vehicles
);

-- Note: We keep the original vehicle_id column for backward compatibility
-- but new contracts with multiple vehicles will use the contract_vehicles table
-- The vehicle_id can be used as the "primary" vehicle for display purposes 