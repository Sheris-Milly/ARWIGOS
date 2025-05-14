import { createClient } from '@supabase/supabase-js';
import { settings } from '../config/settings.js';

if (!settings.SUPABASE_URL || !settings.SUPABASE_KEY) {
  console.error('SUPABASE_URL and SUPABASE_KEY must be set in .env');
  process.exit(1);
}

export const supabase = createClient(settings.SUPABASE_URL, settings.SUPABASE_KEY);

export default supabase;
