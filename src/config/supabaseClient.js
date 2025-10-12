// src/config/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://rypkpdelpmobvslvlbtm.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5cGtwZGVscG1vYnZzbHZsYnRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MTQ5ODAsImV4cCI6MjA3MTE5MDk4MH0.k2Mc-cqmpV0mvaXKH77MTrgg1AubSVIlrvFRlymaiKc";

const supabase = createClient(supabaseUrl, supabaseAnonKey);
export default supabase;
    