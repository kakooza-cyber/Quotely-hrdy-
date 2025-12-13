// client.js - FIXED VERSION
import { createClient } from '@supabase/supabase-js';

// Use Render's environment variables OR fallback for local dev
const getEnvVar = (key, fallback = null) => {
  // Check Render environment variables first
  if (process.env[key]) {
    return process.env[key];
  }
  
  // Fallback for local development (will use .env file via dotenv)
  return fallback;
};

const supabaseUrl = getEnvVar('SUPABASE_URL');
const supabaseServiceKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');
const supabaseAnonKey = getEnvVar('SUPABASE_ANON_KEY');

// Debug logging (don't log full keys)
console.log('🔧 Environment check:');
console.log('SUPABASE_URL present:', !!supabaseUrl);
console.log('SUPABASE_SERVICE_ROLE_KEY present:', !!supabaseServiceKey);
console.log('SUPABASE_ANON_KEY present:', !!supabaseAnonKey);

if (supabaseUrl) {
  console.log('SUPABASE_URL starts with:', supabaseUrl.substring(0, 30) + '...');
}

// If missing in production, use your actual credentials temporarily
let finalUrl = supabaseUrl;
let finalServiceKey = supabaseServiceKey;
let finalAnonKey = supabaseAnonKey;

if (!finalUrl || !finalServiceKey || !finalAnonKey) {
  console.warn('⚠️ Using fallback credentials (for testing only)');
  
  // TEMPORARY: Add your actual Supabase credentials here
  finalUrl = 'https://aaueomdegferrqeqsbzm.supabase.co'; // Replace with your actual URL
  finalServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhdWVvbWRlZ2ZlcnJxZXFzYnptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIwMzAzOCwiZXhwIjoyMDgwNzc5MDM4fQ.6YeVlUhhqGB3eb7_V3bFRRg1eatCYE7jMccHStqhvQY'; // Replace with your actual service key
  finalAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhdWVvbWRlZ2ZlcnJxZXFzYnptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMDMwMzgsImV4cCI6MjA4MDc3OTAzOH0.-7gaEOKYScnhJG-DUlmWwCnjRPVn0cFQgTBmohlLy3o'; // Replace with your actual anon key
}

// Create clients
export const supabase = createClient(finalUrl, finalServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export const supabasePublic = createClient(finalUrl, finalAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  }
});

export const testConnection = async () => {
  try {
    const { error } = await supabase
      .from('quotes')
      .select('id', { count: 'exact', head: true });
    
    if (error) throw error;
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    return false;
  }
};
