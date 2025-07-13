import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize the Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Sample data
const sampleTeams = [
  { name: 'Team Alpha', logo_url: 'https://via.placeholder.com/150/FF5733/FFFFFF?text=Alpha' },
  { name: 'Team Bravo', logo_url: 'https://via.placeholder.com/150/33FF57/FFFFFF?text=Bravo' },
  { name: 'Team Charlie', logo_url: 'https://via.placeholder.com/150/3357FF/FFFFFF?text=Charlie' },
  { name: 'Team Delta', logo_url: 'https://via.placeholder.com/150/F3FF33/000000?text=Delta' },
];

const samplePlayers = [
  // Team Alpha players
  { name: 'Alex Johnson', position: 'Handler', team: 'Team Alpha', available: true, photo_url: 'https://i.pravatar.cc/150?img=1' },
  { name: 'Jordan Smith', position: 'Cutter', team: 'Team Alpha', available: true, photo_url: 'https://i.pravatar.cc/150?img=2' },
  { name: 'Taylor Davis', position: 'Handler', team: 'Team Alpha', available: true, photo_url: 'https://i.pravatar.cc/150?img=3' },
  
  // Team Bravo players
  { name: 'Casey Wilson', position: 'Cutter', team: 'Team Bravo', available: true, photo_url: 'https://i.pravatar.cc/150?img=4' },
  { name: 'Morgan Lee', position: 'Handler', team: 'Team Bravo', available: true, photo_url: 'https://i.pravatar.cc/150?img=5' },
  { name: 'Riley Brown', position: 'Cutter', team: 'Team Bravo', available: true, photo_url: 'https://i.pravatar.cc/150?img=6' },
  
  // Team Charlie players
  { name: 'Jamie Taylor', position: 'Handler', team: 'Team Charlie', available: true, photo_url: 'https://i.pravatar.cc/150?img=7' },
  { name: 'Quinn White', position: 'Cutter', team: 'Team Charlie', available: true, photo_url: 'https://i.pravatar.cc/150?img=8' },
  { name: 'Skyler Green', position: 'Handler', team: 'Team Charlie', available: true, photo_url: 'https://i.pravatar.cc/150?img=9' },
  
  // Team Delta players
  { name: 'Avery Hall', position: 'Cutter', team: 'Team Delta', available: true, photo_url: 'https://i.pravatar.cc/150?img=10' },
  { name: 'Parker Young', position: 'Handler', team: 'Team Delta', available: true, photo_url: 'https://i.pravatar.cc/150?img=11' },
  { name: 'Drew King', position: 'Cutter', team: 'Team Delta', available: true, photo_url: 'https://i.pravatar.cc/150?img=12' },
];

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');
    
    // 1. Clear existing data
    console.log('Clearing existing data...');
    await supabase.from('draft_picks').delete().neq('id', '');
    await supabase.from('players').delete().neq('id', '');
    await supabase.from('teams').delete().neq('id', '');
    
    // 2. Insert teams
    console.log('Inserting teams...');
    const { data: teams, error: teamError } = await supabase
      .from('teams')
      .insert(sampleTeams)
      .select('*');
    
    if (teamError) throw teamError;
    console.log(`Inserted ${teams.length} teams`);
    
    // 3. Insert players with team references
    console.log('Inserting players...');
    const playersToInsert = samplePlayers.map(player => {
      const team = teams.find(t => t.name === player.team);
      return {
        name: player.name,
        position: player.position,
        team: player.team,
        available: player.available,
        photo_url: player.photo_url
      };
    });
    
    const { data: insertedPlayers, error: playerError } = await supabase
      .from('players')
      .insert(playersToInsert)
      .select('*');
    
    if (playerError) throw playerError;
    console.log(`Inserted ${insertedPlayers.length} players`);
    
    // 4. Create some draft picks
    console.log('Creating draft picks...');
    const draftPicks = [
      { pick_number: 1, team_id: teams[0].id, player_id: insertedPlayers[3].id, player_name: insertedPlayers[3].name, player_position: insertedPlayers[3].position },
      { pick_number: 2, team_id: teams[1].id, player_id: insertedPlayers[6].id, player_name: insertedPlayers[6].name, player_position: insertedPlayers[6].position },
      { pick_number: 3, team_id: teams[2].id, player_id: insertedPlayers[0].id, player_name: insertedPlayers[0].name, player_position: insertedPlayers[0].position },
      { pick_number: 4, team_id: teams[3].id, player_id: insertedPlayers[9].id, player_name: insertedPlayers[9].name, player_position: insertedPlayers[9].position },
    ];
    
    const { data: picks, error: pickError } = await supabase
      .from('draft_picks')
      .insert(draftPicks)
      .select('*');
    
    if (pickError) throw pickError;
    console.log(`Created ${picks.length} draft picks`);
    
    // 5. Update player availability for drafted players
    const draftedPlayerIds = draftPicks.map(pick => pick.player_id);
    const { error: updateError } = await supabase
      .from('players')
      .update({ available: false })
      .in('id', draftedPlayerIds);
    
    if (updateError) throw updateError;
    console.log('Updated player availability for drafted players');
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log(`- Teams: ${teams.length}`);
    console.log(`- Players: ${insertedPlayers.length}`);
    console.log(`- Draft Picks: ${picks.length}`);
    console.log('\nYou can now start the application with `npm run dev`');
    
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
