// @ts-check
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { promisify } from 'util';
import crypto from 'crypto';

// Convert callback-based functions to promises
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);

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

async function testStorageAccess() {
  try {
    const bucketName = 'team-logos';
    const testFileName = `test-${Date.now()}.txt`;
    const testFileContent = 'This is a test file for verifying storage access.';
    const testFilePath = join(__dirname, testFileName);
    
    // Create a test file
    await fs.promises.writeFile(testFilePath, testFileContent);
    console.log(`Created test file: ${testFilePath}`);
    
    // 1. Test file upload
    console.log('\nTesting file upload...');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(testFileName, testFileContent, {
        contentType: 'text/plain',
        upsert: true
      });
    
    if (uploadError) {
      console.error('❌ Upload failed:', uploadError.message);
    } else {
      console.log('✅ Upload successful:', uploadData);
      
      // 2. Test file download
      console.log('\nTesting file download...');
      const { data: downloadData, error: downloadError } = await supabase.storage
        .from(bucketName)
        .download(testFileName);
      
      if (downloadError) {
        console.error('❌ Download failed:', downloadError.message);
      } else {
        const content = await downloadData.text();
        console.log('✅ Download successful. File content:', content);
      }
      
      // 3. Test public URL access
      console.log('\nTesting public URL access...');
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(testFileName);
      
      console.log('Public URL:', publicUrlData.publicUrl);
      
      // 4. Test file deletion
      console.log('\nTesting file deletion...');
      const { data: deleteData, error: deleteError } = await supabase.storage
        .from(bucketName)
        .remove([testFileName]);
      
      if (deleteError) {
        console.error('❌ Deletion failed:', deleteError.message);
      } else {
        console.log('✅ Deletion successful:', deleteData);
      }
    }
    
    // Clean up the test file
    try {
      await unlink(testFilePath);
      console.log('\nCleaned up test file.');
    } catch (cleanupError) {
      console.warn('Warning: Could not clean up test file:', cleanupError.message);
    }
    
    console.log('\n✅ Storage access test completed.');
    
  } catch (error) {
    console.error('❌ Error in testStorageAccess:', error.message);
    process.exit(1);
  }
}

// Run the test
testStorageAccess();
