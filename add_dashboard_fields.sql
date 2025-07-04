-- Add dashboard warning light and photo URL fields to inspections table

-- Add dashboard_warning_light field
ALTER TABLE inspections 
ADD COLUMN IF NOT EXISTS dashboard_warning_light BOOLEAN DEFAULT FALSE;

-- Add dashboard_photo_url field  
ALTER TABLE inspections 
ADD COLUMN IF NOT EXISTS dashboard_photo_url TEXT;

-- Update the database types to include these new fields
COMMENT ON COLUMN inspections.dashboard_warning_light IS 'Indicates if there are warning lights on the vehicle dashboard';
COMMENT ON COLUMN inspections.dashboard_photo_url IS 'URL of the dashboard photo when warning lights are present'; 