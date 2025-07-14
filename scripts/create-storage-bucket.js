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

async function createStorageBucket() {
  try {
    console.log('Creating storage bucket: team-logos');
    
    // Check if the bucket already exists
    const { data: buckets, error: listError } = await supabase
      .storage
      .listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      throw listError;
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === 'team-logos');
    
    if (bucketExists) {
      console.log('Bucket "team-logos" already exists. Skipping creation.');
      return;
    }
    
    // Create the bucket
    const { data: bucket, error: createError } = await supabase
      .storage
      .createBucket('team-logos', {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'],
        fileSizeLimit: 5 * 1024 * 1024, // 5MB
      });
    
    if (createError) {
      console.error('Error creating bucket:', createError);
      throw createError;
    }
    
    console.log('Successfully created bucket:', bucket);
    
    // Now create the storage policies
    console.log('Creating storage policies...');
    
    // Policy to allow public read access
    const { error: selectPolicyError } = await supabase.rpc('create_policy', {
      policy_name: 'Public Read Access',
      table_name: 'objects',
      using: 'bucket_id = \'team-logos\'',
      with_check: null,
      command: 'SELECT',
      role: 'public',
      schema_name: 'storage'
    });
    
    if (selectPolicyError) {
      console.error('Error creating read policy:', selectPolicyError);
      throw selectPolicyError;
    }
    
    // Policy to allow authenticated users to insert
    const { error: insertPolicyError } = await supabase.rpc('create_policy', {
      policy_name: 'Allow Insert for Authenticated',
      table_name: 'objects',
      using: 'bucket_id = \'team-logos\'',
      with_check: 'auth.role() = \'authenticated\'',
      command: 'INSERT',
      role: 'authenticated',
      schema_name: 'storage'
    });
    
    if (insertPolicyError) {
      console.error('Error creating insert policy:', insertPolicyError);
      throw insertPolicyError;
    }
    
    // Policy to allow authenticated users to update
    const { error: updatePolicyError } = await supabase.rpc('create_policy', {
      policy_name: 'Allow Update for Authenticated',
      table_name: 'objects',
      using: 'bucket_id = \'team-logos\'',
      with_check: 'auth.role() = \'authenticated\'',
      command: 'UPDATE',
      role: 'authenticated',
      schema_name: 'storage'
    });
    
    if (updatePolicyError) {
      console.error('Error creating update policy:', updatePolicyError);
      throw updatePolicyError;
    }
    
    // Policy to allow authenticated users to delete
    const { error: deletePolicyError } = await supabase.rpc('create_policy', {
      policy_name: 'Allow Delete for Authenticated',
      table_name: 'objects',
      using: 'bucket_id = \'team-logos\'',
      with_check: 'auth.role() = \'authenticated\'',
      command: 'DELETE',
      role: 'authenticated',
      schema_name: 'storage'
    });
    
    if (deletePolicyError) {
      console.error('Error creating delete policy:', deletePolicyError);
      throw deletePolicyError;
    }
    
    console.log('Successfully created all storage policies');
    
  } catch (error) {
    console.error('Error in createStorageBucket:', error.message);
    process.exit(1);
  }
}

// Run the function
createStorageBucket();
