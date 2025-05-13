// supabase.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto'; // required for URL and fetch polyfills

const supabaseUrl = 'https://eniayscdvszkkhwkykuv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuaWF5c2NkdnN6a2tod2t5a3V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2MDA5MjYsImV4cCI6MjA2MTE3NjkyNn0.CpiUQDFCMiPFKJF35Ep9_KXNNeKoCLhWuTOob7xZ1J8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
