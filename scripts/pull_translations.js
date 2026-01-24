const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const _ = require('lodash');

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || (!SUPABASE_KEY && !SERVICE_KEY)) {
    console.error('Error: Supabase credentials missing in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY || SUPABASE_KEY);

const I18N_PATH = path.join(__dirname, '../i18n');
const META_FILE = path.join(__dirname, '../.translation_sync_meta.json');
const LANGUAGES = [
    'en', 'tr', 'de', 'fr', 'lb', 'me', 'mt', 'ru', 'nl',
    'sr', 'hr', 'bs', 'sq', 'uk', 'pl', 'it', 'es', 'el', 'bg', 'ro'
];

async function pull() {
    console.log('🔄 Starting Smart Translation Pull...');

    // 1. Get Last Sync Time
    let lastSync = new Date(0).toISOString(); // Default epoch
    if (fs.existsSync(META_FILE)) {
        try {
            const meta = JSON.parse(fs.readFileSync(META_FILE, 'utf-8'));
            if (meta.last_sync) lastSync = meta.last_sync;
        } catch (e) {
            console.warn('Meta file corrupt, starting fresh.');
        }
    }
    console.log(`Last Sync: ${lastSync}`);

    // 2. Fetch Incremental Changes
    const { data: changes, error } = await supabase
        .from('translations')
        .select('*')
        .gt('updated_at', lastSync);

    if (error) {
        console.error('Fetch Error:', error);
        process.exit(1);
    }

    if (!changes || changes.length === 0) {
        console.log('✅ No new changes found locally up-to-date.');
        return;
    }

    console.log(`📥 Received ${changes.length} updates.`);

    // 3. Process Per Language
    for (const lang of LANGUAGES) {
        const filePath = path.join(I18N_PATH, `${lang}.json`);

        let jsonContent = {};
        if (fs.existsSync(filePath)) {
            try {
                jsonContent = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            } catch (e) {
                console.warn(`Could not read ${lang}.json, creating new.`);
            }
        }

        let updatedCount = 0;

        for (const row of changes) {
            const key = row.key; // e.g. "nav.login"
            const value = row[lang]; // Translate Value

            // Only update if value exists (not null)
            if (value !== null && value !== undefined) {
                // Use lodash set to preserve structure
                // If nested "nav" doesn't exist, lodash creates it
                // We trust lodash/set to handle nested creation correctly
                _.set(jsonContent, key, value);
                updatedCount++;
            }
        }

        if (updatedCount > 0) {
            console.log(`Writing ${updatedCount} updates to ${lang}.json...`);
            // Write with indentation to keep git diff clean
            fs.writeFileSync(filePath, JSON.stringify(jsonContent, null, 2), 'utf-8');
        }
    }

    // 4. Update Meta File
    const now = new Date().toISOString();
    fs.writeFileSync(META_FILE, JSON.stringify({ last_sync: now }, null, 2), 'utf-8');
    console.log(`✅ Sync Completed. Meta updated to ${now}`);
}

pull();
