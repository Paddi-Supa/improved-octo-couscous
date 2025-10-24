// utils/supabaseClient.js
import { createClient } from '@supabase/supabase-js';
import './global-polyfills'; // Import polyfills first

// ⭐️ Read directly from process.env due to modern Expo SDK support
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL; 
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Always good to have a runtime check
  console.error("Supabase configuration missing from environment variables!");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, 
  }
});                            