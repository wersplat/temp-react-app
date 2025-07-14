// @ts-check
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

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
    }
  }
);

async function applyMigration() {
  try {
    console.log('Reading migration file...');
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20240714062214_create_team_logos_bucket.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf-8');
    
    console.log('Applying migration...');
    const { data, error } = await supabase.rpc('pg_temp._execute_sql', { sql: migrationSQL });
    
    if (error) {
      // If the RPC method doesn't exist, try executing the SQL directly
      if (error.message.includes('function pg_temp._execute_sql(unknown) does not exist')) {
        console.log('Falling back to direct SQL execution...');
        await executeSQLDirectly(migrationSQL);
        return;
      }
      throw error;
    }
    
    console.log('Migration applied successfully!');
  } catch (error) {
    console.error('Error applying migration:', error.message);
    process.exit(1);
  }
}

async function executeSQLDirectly(sql) {
  // Split the SQL into individual statements and execute them one by one
  const statements = sql.split(';').filter(statement => statement.trim() !== '');
  
  for (const statement of statements) {
    const trimmedStatement = statement.trim();
    if (!trimmedStatement) continue;
    
    console.log('Executing statement:', trimmedStatement);
    const { error } = await supabase.rpc('exec', { sql: trimmedStatement });
    
    if (error) {
      // If the exec function doesn't exist, try the SQL endpoint directly
      if (error.message.includes('function exec(unknown) does not exist')) {
        console.log('Falling back to direct SQL endpoint...');
        const { error: sqlError } = await supabase.rpc('sql', { query: trimmedStatement });
        if (sqlError) throw sqlError;
      } else {
        throw error;
      }
    }
  }
  
  console.log('All SQL statements executed successfully!');
}

// Run the migration
applyMigration();
