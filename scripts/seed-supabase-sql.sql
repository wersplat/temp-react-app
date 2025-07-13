-- SQL script to seed the database with sample data
-- Run this in the Supabase SQL editor (https://app.supabase.com/project/[YOUR_PROJECT_REF]/sql)

-- 1. First, disable RLS on all tables
ALTER TABLE draft_picks DISABLE ROW LEVEL SECURITY;
ALTER TABLE players DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- 2. Clear existing data in the correct order to respect foreign key constraints
TRUNCATE TABLE draft_picks CASCADE;
TRUNCATE TABLE players CASCADE;
TRUNCATE TABLE teams CASCADE;
TRUNCATE TABLE events CASCADE;

-- 3. Insert sample event
INSERT INTO events (
  id, name, date, num_teams, picks_per_team, draft_type, 
  pick_time_seconds, prize_pool, prize_breakdown
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '2023 UPA Championship Draft',
  '2023-12-15',
  4,
  3,
  'snake',
  60,
  10000.00,
  '{"first": 5000.00, "second": 3000.00, "third": 1500.00, "fourth": 500.00}'
);

-- 4. Insert sample teams
INSERT INTO teams (id, name, slug, logo_url, draft_order, event_id) VALUES 
  ('10000000-0000-0000-0000-000000000001', 'Team Alpha', 'team-alpha', 'https://via.placeholder.com/150/FF5733/FFFFFF?text=Alpha', 1, '00000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000002', 'Team Bravo', 'team-bravo', 'https://via.placeholder.com/150/33FF57/FFFFFF?text=Bravo', 2, '00000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000003', 'Team Charlie', 'team-charlie', 'https://via.placeholder.com/150/3357FF/FFFFFF?text=Charlie', 3, '00000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000004', 'Team Delta', 'team-delta', 'https://via.placeholder.com/150/F3FF33/000000?text=Delta', 4, '00000000-0000-0000-0000-000000000001');

-- 5. Insert sample players
INSERT INTO players (id, name, event_id) VALUES 
  -- Team Alpha players
  ('20000000-0000-0000-0000-000000000001', 'Alex Johnson', '00000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000002', 'Jordan Smith', '00000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000003', 'Taylor Davis', '00000000-0000-0000-0000-000000000001'),
  
  -- Team Bravo players
  ('20000000-0000-0000-0000-000000000004', 'Casey Wilson', '00000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000005', 'Morgan Lee', '00000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000006', 'Riley Brown', '00000000-0000-0000-0000-000000000001'),
  
  -- Team Charlie players
  ('20000000-0000-0000-0000-000000000007', 'Jamie Taylor', '00000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000008', 'Quinn White', '00000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000009', 'Skyler Green', '00000000-0000-0000-0000-000000000001'),
  
  -- Team Delta players
  ('20000000-0000-0000-0000-000000000010', 'Avery Hall', '00000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000011', 'Parker Young', '00000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000012', 'Drew King', '00000000-0000-0000-0000-000000000001');

-- 6. Create some draft picks
INSERT INTO draft_picks (event_id, team_id, pick, round, player, notes, traded) VALUES 
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 1, 1, 'Casey Wilson', 'First round pick', false),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 2, 1, 'Jamie Taylor', 'First round pick', false),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 3, 1, 'Alex Johnson', 'First round pick', false),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 4, 1, 'Avery Hall', 'First round pick', false);

-- 7. Re-enable RLS on all tables (optional, comment out if you want to keep RLS disabled)
-- ALTER TABLE draft_picks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE players ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- 8. Output success message
SELECT '✅ Database seeded successfully!' as message;
