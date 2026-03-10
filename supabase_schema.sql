-- Add new columns to vehicles
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS measurement_type TEXT DEFAULT 'odometer';
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS contract_company TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS contract_work TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS contract_start_date DATE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS contract_closing_day INTEGER;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS contract_value NUMERIC;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS contract_observation TEXT;

-- Add week_start_date to agenda
ALTER TABLE agenda ADD COLUMN IF NOT EXISTS week_start_date DATE;

-- Create report_issues table
CREATE TABLE IF NOT EXISTS report_issues (
  id SERIAL PRIMARY KEY,
  maintenance_id INTEGER REFERENCES maintenances(id) ON DELETE CASCADE,
  mechanic_name TEXT,
  description TEXT,
  status TEXT DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create app_users table
CREATE TABLE IF NOT EXISTS app_users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL
);

-- Insert default users
INSERT INTO app_users (username, password, role) VALUES
  ('administrador', 'admin2013', 'admin'),
  ('Sopipa', 'pipa2013', 'mechanic')
ON CONFLICT (username) DO NOTHING;
