import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://oisqrlhwwnuilurvvvdf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pc3FybGh3d251aWx1cnZ2dmRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NzA5MzAsImV4cCI6MjA4NTA0NjkzMH0.LaPbqMZt3lAaqTIdA_a8fnFvWM_ez_axXV-C-MppbBM";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
