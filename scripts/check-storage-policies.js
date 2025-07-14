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
    }
  }
);

async function checkStoragePolicies() {
  try {
    console.log('Checking storage policies for bucket: team-logos');
    
    // Check if the bucket exists
    const { data: bucket, error: bucketError } = await supabase
      .storage
      .getBucket('team-logos');
    
    if (bucketError || !bucket) {
      console.error('Error getting bucket:', bucketError?.message || 'Bucket not found');
      process.exit(1);
    }
    
    console.log('Bucket found:', bucket.name);
    console.log('Public:', bucket.public);
    console.log('Allowed MIME types:', bucket.allowedMimeTypes || 'No restrictions');
    console.log('File size limit:', bucket.fileSizeLimit ? `${bucket.fileSizeLimit / (1024 * 1024)}MB` : 'No limit');
    
    // Check the storage policies
    console.log('\nChecking storage policies...');
    
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('schemaname', 'storage')
      .eq('tablename', 'objects');
    
    if (policiesError) {
      console.error('Error fetching policies:', policiesError);
      process.exit(1);
    }
    
    if (policies.length === 0) {
      console.log('No storage policies found.');
    } else {
      console.log(`Found ${policies.length} storage policies:`);
      policies.forEach(policy => {
        console.log(`\nPolicy: ${policy.policyname}`);
        console.log(`- Roles: ${policy.policies}`);
        console.log(`- Command: ${policy.cmd}`);
        console.log(`- Using: ${policy.qual}`);
        console.log(`- With check: ${policy.with_check || 'N/A'}`);
      });
    }
    
    console.log('\nStorage setup check completed.');
    
  } catch (error) {
    console.error('Error checking storage policies:', error.message);
    process.exit(1);
  }
}

// Run the check
checkStoragePolicies();
