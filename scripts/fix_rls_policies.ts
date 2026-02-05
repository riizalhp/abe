
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Try to load .env.local first, then .env
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
    console.log('Loading env from:', envLocalPath);
    dotenv.config({ path: envLocalPath });
} else {
    console.log('Loading env from .env');
    dotenv.config();
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key in environment variables.');
    process.exit(1);
}

console.log('Supabase URL:', supabaseUrl);
// console.log('Supabase Key:', supabaseKey ? '********' : 'Missing');

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyPolicies() {
    console.log('Applying RLS policies...');

    const queries = [
        // 1. Ensure branches table exists and has RLS
        `DO $$ 
    BEGIN
      -- Ensure branches table exists (if not created by migration)
      CREATE TABLE IF NOT EXISTS branches (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        workshop_id UUID DEFAULT NULL, -- Can be null or ref
        name TEXT NOT NULL,
        code TEXT NOT NULL,
        address TEXT,
        phone TEXT,
        is_main BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    EXCEPTION
      WHEN duplicate_table THEN NULL;
    END $$;`,

        `ALTER TABLE branches ENABLE ROW LEVEL SECURITY;`,

        // Drop existing policy to avoid conflict/duplication
        `DROP POLICY IF EXISTS "Public Read Branches" ON branches;`,
        // Create policy for public read
        `CREATE POLICY "Public Read Branches" ON branches FOR SELECT USING (true);`,

        // 2. Ensure time_slots table RLS
        `ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;`,
        `DROP POLICY IF EXISTS "Public Read Time Slots" ON time_slots;`,
        `CREATE POLICY "Public Read Time Slots" ON time_slots FOR SELECT USING (true);`
    ];

    for (const query of queries) {
        try {
            console.log(`Executing: ${query}`);
            // Use the exec_sql RPC
            const { data, error } = await supabase.rpc('exec_sql', { query });

            if (error) {
                console.error('Error executing query via RPC:', error);
                // If RPC fails (e.g. not defined), we can't do much with anon key unless we have direct SQL access
                // But the error might be something else.
            } else {
                console.log('Success.');
            }
        } catch (e) {
            console.error('Exception:', e);
        }
    }
}

applyPolicies();
