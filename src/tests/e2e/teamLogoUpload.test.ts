import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/supabase';

// Test data
const TEST_EVENT = {
  name: 'Test Event for Logo Upload',
  date: new Date().toISOString().split('T')[0],
  numTeams: 12,
  picksPerTeam: 15,
  pickTimeSeconds: 60,
  prizePool: '1000',
};

const TEST_TEAM = {
  name: 'Test Team with Logo',
};

test.describe('Team Logo Upload', () => {
  let testEventId: string;
  
  // Setup: Create a test event
  test.beforeAll(async () => {
    // Sign in with admin credentials if needed
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: process.env.SUPABASE_ADMIN_EMAIL || 'admin@example.com',
      password: process.env.SUPABASE_ADMIN_PASSWORD || 'password',
    });
    
    if (authError) {
      console.error('Auth error:', authError);
      throw authError;
    }
    
    // Create a test event
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .insert({
        name: TEST_EVENT.name,
        date: TEST_EVENT.date,
        num_teams: TEST_EVENT.numTeams,
        picks_per_team: TEST_EVENT.picksPerTeam,
        pick_time_seconds: TEST_EVENT.pickTimeSeconds,
        prize_pool: parseFloat(TEST_EVENT.prizePool),
        is_active: true,
        draft_type: 'snake',
        created_at: new Date().toISOString()
      } as Database['public']['Tables']['events']['Insert'])
      .select('id')
      .single();
      
    if (eventError) {
      console.error('Error creating test event:', eventError);
      throw eventError;
    }
    
    testEventId = eventData.id;
    console.log('Created test event with ID:', testEventId);
  });
  
  // Teardown: Clean up test data
  test.afterAll(async () => {
    // Delete test teams
    await supabase
      .from('teams')
      .delete()
      .eq('name', TEST_TEAM.name);
    
    // Delete test event
    await supabase
      .from('events')
      .delete()
      .eq('id', testEventId);
    
    // Clean up any uploaded files
    const { data: files } = await supabase.storage
      .from('team-logos')
      .list();
      
    if (files) {
      const filesToRemove = files.map(file => `team-logos/${file.name}`);
      await supabase.storage
        .from('team-logos')
        .remove(filesToRemove);
    }
    
    // Sign out
    await supabase.auth.signOut();
  });
  
  test('should upload a team logo and create a team', async ({ page }: { page: Page }) => {
    // Navigate to the admin page
    await page.goto('/admin');
    
    // Wait for the page to load and select the test event
    await page.waitForSelector('select[aria-label="Select event"]');
    await page.selectOption('select[aria-label="Select event"]', testEventId);
    
    // Fill in the team name
    await page.fill('input[placeholder="e.g., Los Angeles Lakers"]', TEST_TEAM.name);
    
    // Upload a test image
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('button:has-text("Select File")');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles('src/tests/fixtures/test-logo.png');
    
    // Verify the preview is shown
    await expect(page.locator('img[alt="Team logo preview"]')).toBeVisible();
    
    // Submit the form
    await page.click('button:has-text("Add Team")');
    
    // Verify success message
    await expect(page.locator('text=Team added successfully')).toBeVisible();
    
    // Verify the team was created with a logo
    const { data: team, error } = await supabase
      .from('teams')
      .select('*')
      .eq('name', TEST_TEAM.name)
      .single();
      
    expect(error).toBeNull();
    expect(team).not.toBeNull();
    expect(team?.logo_url).toBeTruthy();
    
    // Verify the logo is accessible
    if (!team?.logo_url) {
      throw new Error('Team logo URL is missing');
    }
    const logoResponse = await fetch(team.logo_url);
    expect(logoResponse.status).toBe(200);
  });
  
  test('should show error for invalid file type', async ({ page }: { page: Page }) => {
    await page.goto('/admin');
    await page.waitForSelector('select[aria-label="Select event"]');
    await page.selectOption('select[aria-label="Select event"]', testEventId);
    
    // Upload an invalid file type
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('button:has-text("Select File")');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles('src/tests/fixtures/invalid-file.txt');
    
    // Verify error message
    await expect(page.locator('text=Invalid file type. Please upload a JPG, PNG, GIF, or WebP image.')).toBeVisible();
  });
  
  test('should show error for file that is too large', async ({ page }: { page: Page }) => {
    await page.goto('/admin');
    await page.waitForSelector('select[aria-label="Select event"]');
    await page.selectOption('select[aria-label="Select event"]', testEventId);
    
    // Create a large file (3MB)
    const largeFile = Buffer.alloc(3 * 1024 * 1024); // 3MB
    
    // Upload the large file
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('button:has-text("Select File")');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'large-image.jpg',
      mimeType: 'image/jpeg',
      buffer: largeFile
    });
    
    // Verify error message
    await expect(page.locator('text=File is too large. Maximum size is 2MB.')).toBeVisible();
  });
});
