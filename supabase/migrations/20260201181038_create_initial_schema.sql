/*
  # Employee Shift Management System - Initial Schema

  ## Overview
  Creates the foundational database structure for an employee shift management application
  that supports admin and employee roles with shift scheduling capabilities.

  ## New Tables
  
  ### 1. `profiles`
  Extends Supabase auth.users with additional employee information:
  - `id` (uuid, primary key) - Links to auth.users.id
  - `email` (text, not null) - Employee email address
  - `full_name` (text, not null) - Employee's full name
  - `role` (text, not null) - User role: 'admin' or 'employee'
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `shifts`
  Stores all shift assignments and schedules:
  - `id` (uuid, primary key) - Unique shift identifier
  - `employee_id` (uuid, not null) - References profiles.id
  - `shift_date` (date, not null) - The date of the shift
  - `start_time` (time, not null) - Shift start time
  - `end_time` (time, not null) - Shift end time
  - `shift_role` (text, not null) - Role/position for this shift (e.g., "Cashier", "Manager")
  - `is_published` (boolean, default false) - Whether employees can see this shift
  - `created_at` (timestamptz) - Shift creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  
  ### Row Level Security (RLS)
  All tables have RLS enabled with the following policies:
  
  #### Profiles Table:
  - Admins can view all profiles
  - Employees can view their own profile
  - Admins can update all profiles
  - Employees can update their own profile
  
  #### Shifts Table:
  - Admins can view all shifts (published and draft)
  - Employees can only view their own published shifts
  - Admins can insert, update, and delete all shifts
  - Employees cannot modify shifts

  ## Indexes
  - `idx_shifts_employee_date` - For efficient querying of shifts by employee and date
  - `idx_shifts_date_published` - For efficient querying of published shifts by date
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'employee')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create shifts table
CREATE TABLE IF NOT EXISTS shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  shift_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  shift_role text NOT NULL,
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_shifts_employee_date ON shifts(employee_id, shift_date);
CREATE INDEX IF NOT EXISTS idx_shifts_date_published ON shifts(shift_date, is_published);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Employees can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Employees can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Shifts policies
CREATE POLICY "Admins can view all shifts"
  ON shifts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Employees can view own published shifts"
  ON shifts FOR SELECT
  TO authenticated
  USING (
    auth.uid() = employee_id
    AND is_published = true
  );

CREATE POLICY "Admins can insert shifts"
  ON shifts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update shifts"
  ON shifts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete shifts"
  ON shifts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shifts_updated_at
  BEFORE UPDATE ON shifts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add check constraint for role not empty
ALTER TABLE shifts ADD CONSTRAINT shift_role_not_empty 
  CHECK (length(trim(shift_role)) > 0);

-- Add unique constraint to prevent overlapping shifts
-- (This is complex - would need to use exclusion constraints with ranges)

-- Add check for reasonable shift times (not spanning more than 24 hours)
ALTER TABLE shifts ADD CONSTRAINT reasonable_shift_duration
  CHECK (
    EXTRACT(EPOCH FROM (shift_date + end_time) - (shift_date + start_time)) / 3600 <= 24
  );
