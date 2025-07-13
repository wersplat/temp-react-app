import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface TestData {
  auth: {
    session: {
      access_token: string;
      refresh_token: string;
      expires_in: number;
      token_type: string;
      user: {
        id: string;
        email?: string | null;
        user_metadata?: Record<string, unknown> | null;
      } | null;
    } | null;
  };
  teams: Array<{
    id: string;
    name: string;
    logo_url: string | null;
    created_at: string;
    event_id: string | null;
    draft_order: number | null;
    slug: string | null;
  }>;
  draftPicks: Array<{
    id: number;
    event_id: string | null;
    team_id: string | null;
    pick: number;
    round: number;
    player: string;
    notes: string | null;
    traded: boolean;
    created_at: string;
    created_by: string | null;
  }>;
}

export default function TestPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TestData | null>(null);

  useEffect(() => {
    async function testConnection() {
      try {
        setLoading(true);
        
        // Test connection to Supabase
        const { data: authData, error: authError } = await supabase.auth.getSession();
        console.log('Auth session:', authData);
        
        if (authError) {
          console.error('Auth error:', authError);
          setError(`Auth error: ${authError.message}`);
          return;
        }
        
        // Test teams table
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('*')
          .limit(5);
          
        console.log('Teams data:', teamsData);
        
        if (teamsError) {
          console.error('Teams error:', teamsError);
          setError(`Teams error: ${teamsError.message}`);
          return;
        }
        
        // Test draft_picks table instead of players
        const { data: draftPicksData, error: picksError } = await supabase
          .from('draft_picks')
          .select('*')
          .limit(5);
          
        console.log('Draft picks data:', draftPicksData);
        
        if (picksError) {
          console.error('Draft picks error:', picksError);
          setError(`Draft picks error: ${picksError.message}`);
          return;
        }
        
        setData({
          auth: authData,
          teams: teamsData || [],
          draftPicks: draftPicksData || []
        });
        
      } catch (err) {
        console.error('Test error:', err);
        setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    }
    
    testConnection();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Testing Supabase connection...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-6 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-xl font-semibold text-red-700 mb-4">Connection Error</h2>
        <p className="text-red-600 mb-4">{error}</p>
        <div className="bg-white p-4 rounded border border-gray-200">
          <h3 className="font-medium mb-2">Troubleshooting steps:</h3>
          <ol className="list-decimal pl-5 space-y-2 text-sm">
            <li>Check your internet connection</li>
            <li>Verify your Supabase URL and anon key in the .env file</li>
            <li>Ensure CORS is properly configured in your Supabase project settings</li>
            <li>Check the browser's network tab for failed requests</li>
            <li>Verify that RLS policies allow public read access to the tables</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Supabase Connection Test</h1>
      
      <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
        <h2 className="text-lg font-semibold text-green-700 mb-2">✓ Connection Successful</h2>
        <p className="text-green-600">Your app is successfully connected to Supabase!</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">Auth Session</h2>
          <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-60">
            {JSON.stringify(data?.auth, null, 2)}
          </pre>
        </div>
        
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">Sample Teams ({data?.teams?.length || 0})</h2>
          <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-60">
            {JSON.stringify(data?.teams, null, 2)}
          </pre>
        </div>
        
        <div className="border rounded-lg p-4 md:col-span-2">
          <h2 className="text-lg font-semibold mb-3">Sample Draft Picks ({data?.draftPicks?.length || 0})</h2>
          <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-60">
            {JSON.stringify(data?.draftPicks, null, 2)}
          </pre>
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h2 className="text-lg font-semibold text-blue-700 mb-2">Next Steps</h2>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Check your browser's console for detailed logs</li>
          <li>Verify data is being displayed correctly above</li>
          <li>If you see data, the issue might be in your components</li>
          <li>If you don't see data, check your RLS policies in Supabase</li>
        </ul>
      </div>
    </div>
  );
}
