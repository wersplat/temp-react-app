// @ts-check
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from the root .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: Missing required environment variables. Please check your .env file.');
  process.exit(1);
}

console.log('Connecting to Supabase project at:', supabaseUrl);

const supabase = createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        'X-Client-Info': 'upa-draft-app-seeder/1.0.0',
      },
    },
    db: {
      schema: 'public',
    },
  }
);

// Function to set the auth context for RLS
async function setAuthContext() {
  try {
    // Set a fake JWT claim to bypass RLS
    const { data, error } = await supabase.rpc('set_claims', {
      role: 'service_role',
      claims: {
        role: 'service_role',
        email: 'seeder@example.com',
        sub: '00000000-0000-0000-0000-000000000000',
        app_metadata: {
          provider: 'email',
          roles: ['service_role']
        },
        user_metadata: {
          full_name: 'Seeder Bot'
        },
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        iat: Math.floor(Date.now() / 1000),
        aud: 'authenticated',
        iss: 'supabase'
      }
    });

    if (error) {
      console.warn('Warning: Could not set auth context. This might cause RLS issues:', error.message);
    }
  } catch (err) {
    console.warn('Warning: Could not set auth context. This might cause RLS issues:', err.message);
  }
}

// Sample data
const eventId = '00000000-0000-0000-0000-000000000001';

const sampleEvent = {
  id: eventId,
  name: '2023 UPA Championship Draft',
  date: '2023-12-15',
  num_teams: 4,
  picks_per_team: 3,
  draft_type: 'snake',
  pick_time_seconds: 60,
  prize_pool: 10000.00,
  prize_breakdown: {
    first: 5000.00,
    second: 3000.00,
    third: 1500.00,
    fourth: 500.00
  }
};

const sampleTeams = [
  { 
    name: 'Team Alpha', 
    slug: 'team-alpha',
    logo_url: 'https://via.placeholder.com/150/FF5733/FFFFFF?text=Alpha',
    draft_order: 1,
    event_id: eventId
  },
  { 
    name: 'Team Bravo', 
    slug: 'team-bravo',
    logo_url: 'https://via.placeholder.com/150/33FF57/FFFFFF?text=Bravo',
    draft_order: 2,
    event_id: eventId
  },
  { 
    name: 'Team Charlie', 
    slug: 'team-charlie',
    logo_url: 'https://via.placeholder.com/150/3357FF/FFFFFF?text=Charlie',
    draft_order: 3,
    event_id: eventId
  },
  { 
    name: 'Team Delta', 
    slug: 'team-delta',
    logo_url: 'https://via.placeholder.com/150/F3FF33/000000?text=Delta',
    draft_order: 4,
    event_id: eventId
  },
];

const samplePlayers = [
  // Team Alpha players
  { name: 'Alex Johnson', event_id: eventId },
  { name: 'Jordan Smith', event_id: eventId },
  { name: 'Taylor Davis', event_id: eventId },
  
  // Team Bravo players
  { name: 'Casey Wilson', event_id: eventId },
  { name: 'Morgan Lee', event_id: eventId },
  { name: 'Riley Brown', event_id: eventId },
  
  // Team Charlie players
  { name: 'Jamie Taylor', event_id: eventId },
  { name: 'Quinn White', event_id: eventId },
  { name: 'Skyler Green', event_id: eventId },
  
  // Team Delta players
  { name: 'Avery Hall', event_id: eventId },
  { name: 'Parker Young', event_id: eventId },
  { name: 'Drew King', event_id: eventId },
];

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');
    
    // Set auth context to bypass RLS
    console.log('Setting auth context...');
    await setAuthContext();
    
    // 1. Clear existing data in the correct order to respect foreign key constraints
    console.log('Clearing existing data...');
    
    // First, clear draft picks
    console.log('Deleting all draft picks...');
    const { error: clearDraftPicksError } = await supabase
      .from('draft_picks')
      .delete()
      .neq('id', 0); // This will match all records since id is auto-incrementing
    
    if (clearDraftPicksError) {
      console.error('Error clearing draft_picks:', clearDraftPicksError);
      throw clearDraftPicksError;
    }
    
    // Then clear players
    console.log('Deleting all players...');
    const { error: clearPlayersError } = await supabase
      .from('players')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // This will match all records
    
    if (clearPlayersError) {
      console.error('Error clearing players:', clearPlayersError);
      throw clearPlayersError;
    }
    
    // Then clear teams
    console.log('Deleting all teams...');
    const { error: clearTeamsError } = await supabase
      .from('teams')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // This will match all records
    
    if (clearTeamsError) {
      console.error('Error clearing teams:', clearTeamsError);
      throw clearTeamsError;
    }
    
    // Finally, clear events
    console.log('Deleting all events...');
    const { error: clearEventsError } = await supabase
      .from('events')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // This will match all records
    
    if (clearEventsError) {
      console.error('Error clearing events:', clearEventsError);
      throw clearEventsError;
    }
    
    // 2. Insert event
    console.log('Inserting event...');
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert(sampleEvent)
      .select('*')
      .single();
    
    if (eventError) {
      console.error('Error inserting event:', eventError);
      throw eventError;
    }
    console.log('Inserted event:', event.name);
    
    // 3. Insert teams
    console.log('Inserting teams...');
    const { data: teams, error: teamError } = await supabase
      .from('teams')
      .insert(sampleTeams)
      .select('*');
    
    if (teamError) {
      console.error('Error inserting teams:', teamError);
      throw teamError;
    }
    console.log(`Inserted ${teams.length} teams`);
    
    // 4. Insert players
    console.log('Inserting players...');
    const { data: insertedPlayers, error: playerError } = await supabase
      .from('players')
      .insert(samplePlayers)
      .select('*');
    
    if (playerError) {
      console.error('Error inserting players:', playerError);
      throw playerError;
    }
    console.log(`Inserted ${insertedPlayers.length} players`);
    
    // 5. Create some draft picks
    console.log('Creating draft picks...');
    
    // Make sure we have enough players and teams
    if (insertedPlayers.length < 10 || teams.length < 4) {
      throw new Error('Not enough players or teams to create draft picks');
    }
    
    const draftPicks = [
      { 
        event_id: eventId,
        team_id: teams[0].id, 
        pick: 1,
        round: 1,
        player: insertedPlayers[3].name,
        notes: 'First round pick',
        traded: false
      },
      { 
        event_id: eventId,
        team_id: teams[1].id, 
        pick: 2,
        round: 1,
        player: insertedPlayers[6].name,
        notes: 'First round pick',
        traded: false
      },
      { 
        event_id: eventId,
        team_id: teams[2].id, 
        pick: 3,
        round: 1,
        player: insertedPlayers[0].name,
        notes: 'First round pick',
        traded: false
      },
      { 
        event_id: eventId,
        team_id: teams[3].id, 
        pick: 4,
        round: 1,
        player: insertedPlayers[9].name,
        notes: 'First round pick',
        traded: false
      },
    ];
    
    const { data: picks, error: pickError } = await supabase
      .from('draft_picks')
      .insert(draftPicks)
      .select('*');
    
    if (pickError) {
      console.error('Error creating draft picks:', pickError);
      throw pickError;
    }
    
    console.log(`Created ${picks.length} draft picks`);
    console.log('Updated player availability for drafted players');
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log(`- Event: ${event.name}`);
    console.log(`- Teams: ${teams.length}`);
    console.log(`- Players: ${insertedPlayers.length}`);
    console.log(`- Draft Picks: ${picks.length}`);
    console.log('\nYou can now start the application with `npm run dev`');
    
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeder
seedDatabase();
