import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://khdsnupzgzhfactvrkhn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoZHNudXB6Z3poZmFjdHZya2huIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NTY2MTksImV4cCI6MjA4NTMzMjYxOX0.7QkK4BZhZCPyhgEezKqicqE9eJvGVtXMUdqD4Pr-lAY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
