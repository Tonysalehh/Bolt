/*
  # Task Management System Schema

  1. New Tables
    - profiles (extends auth.users)
      - id (uuid, references auth.users)
      - full_name (text)
      - role (text)
      - created_at (timestamp)
      - updated_at (timestamp)
    
    - teams
      - id (uuid)
      - name (text)
      - description (text)
      - created_at (timestamp)
      - updated_at (timestamp)

    - team_members
      - team_id (uuid, references teams)
      - user_id (uuid, references profiles)
      - role (text)
      - created_at (timestamp)

    - tasks
      - id (uuid)
      - title (text)
      - description (text)
      - deadline (timestamp)
      - status (text)
      - priority (text)
      - assigned_to_user (uuid, references profiles)
      - assigned_to_team (uuid, references teams)
      - created_by (uuid, references profiles)
      - reference_link (text)
      - created_at (timestamp)
      - updated_at (timestamp)

    - task_notifications
      - id (uuid)
      - task_id (uuid, references tasks)
      - user_id (uuid, references profiles)
      - type (text)
      - message (text)
      - read (boolean)
      - created_at (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create profiles table
CREATE TABLE profiles (
  id uuid REFERENCES auth.users PRIMARY KEY,
  full_name text,
  role text CHECK (role IN ('admin', 'user', 'manager')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create teams table
CREATE TABLE teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create team_members table
CREATE TABLE team_members (
  team_id uuid REFERENCES teams ON DELETE CASCADE,
  user_id uuid REFERENCES profiles ON DELETE CASCADE,
  role text CHECK (role IN ('leader', 'member')),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (team_id, user_id)
);

-- Create tasks table
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  deadline timestamptz,
  status text CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
  priority text CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  assigned_to_user uuid REFERENCES profiles,
  assigned_to_team uuid REFERENCES teams,
  created_by uuid REFERENCES profiles NOT NULL,
  reference_link text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create task_notifications table
CREATE TABLE task_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks ON DELETE CASCADE,
  user_id uuid REFERENCES profiles,
  type text CHECK (type IN ('reminder', 'assignment', 'update')),
  message text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view their teams"
  ON teams FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_id = teams.id AND user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view tasks assigned to them or their team"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    assigned_to_user = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_id = tasks.assigned_to_team AND user_id = auth.uid()
    ) OR
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view their notifications"
  ON task_notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();