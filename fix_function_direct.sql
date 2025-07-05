-- Fix get_employee_by_id function directly
-- Drop the function if it exists to recreate it properly
DROP FUNCTION IF EXISTS public.get_employee_by_id(uuid);

-- Create function to safely get employee data
CREATE OR REPLACE FUNCTION public.get_employee_by_id(user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    employee_data jsonb;
BEGIN
    -- Direct query without RLS to get employee data
    SELECT jsonb_build_object(
        'id', e.id,
        'name', e.name,
        'role', e.role,
        'tenant_id', e.tenant_id,
        'contact_info', e.contact_info,
        'permissions', e.permissions,
        'roles_extra', e.roles_extra,
        'active', e.active,
        'created_at', e.created_at,
        'updated_at', e.updated_at
    )
    INTO employee_data
    FROM employees e
    WHERE e.id = user_id::text
    AND e.active = true
    AND (e.contact_info->>'status' IS NULL 
        OR e.contact_info->>'status' NOT IN ('orphaned', 'orphaned_duplicate', 'duplicate_resolved'));

    RETURN employee_data;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_employee_by_id(uuid) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.get_employee_by_id IS 'Safely retrieves employee data by ID without triggering RLS policies';

-- Also fix the RLS policies to allow basic access
DROP POLICY IF EXISTS "employees_select_policy" ON employees;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON employees;

-- Create a simple policy that allows authenticated users to read their own data
CREATE POLICY "employees_self_access" ON employees
FOR SELECT TO authenticated
USING (
  id = auth.uid()::text
  AND active = true
);

-- Create a policy that allows users to read all employees in their tenant
CREATE POLICY "employees_tenant_access" ON employees
FOR SELECT TO authenticated
USING (
  tenant_id = (
    SELECT tenant_id 
    FROM employees 
    WHERE id = auth.uid()::text 
    AND active = true
    LIMIT 1
  )
  AND active = true
);

-- Ensure RLS is enabled
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT ON employees TO authenticated; 