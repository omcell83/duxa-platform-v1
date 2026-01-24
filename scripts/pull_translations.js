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

async function fetchAllChanges(lastSync) {
    let allChanges = [];
    let page = 0;
    const PAGE_SIZE = 1000;
    let hasMore = true;

    while (hasMore) {
        console.log(`Fetching changes page ${page} (size: ${PAGE_SIZE})...`);
        const { data, error } = await supabase
            .from('translations')
            .select('*')
            .gt('updated_at', lastSync)
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
            .order('updated_at', { ascending: true }); // Process oldest updates first

        if (error) {
            console.error('Fetch Error:', error);
            throw error;
        }

        if (data && data.length > 0) {
            allChanges = allChanges.concat(data);
            if (data.length < PAGE_SIZE) {
                hasMore = false;
            } else {
                page++;
            }
        } else {
            hasMore = false;
        }
    }
    return allChanges;
}

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

    // 2. Fetch Incremental Changes (Pagination)
    let changes = [];
    try {
        changes = await fetchAllChanges(lastSync);
    } catch (e) {
        console.error("Failed to fetch changes");
        process.exit(1);
    }

    if (!changes || changes.length === 0) {
        console.log('✅ No new changes found locally up-to-date.');
        return;
    }

    console.log(`📥 Received ${changes.length} unique updates.`);

    // 3. Process Per Language
    for (const lang of LANGUAGES) {
        const filePath = path.join(I18N_PATH, `${lang}.json`);

        let jsonContent = {};
        if (fs.existsSync(filePath)) {
            try {
                // IMPORTANT: Read existing file to preserve structure allowing updates only
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
            // If it is null/undefined in DB, we typically don't delete from JSON unless strict sync is required
            // For now, we only UPSERT
            if (value !== null && value !== undefined) {
                // Use lodash set to preserve structure and handle nested keys
                const currentVal = _.get(jsonContent, key);
                // Only write if value actually changed or didn't exist
                if (currentVal !== value) {
                    _.set(jsonContent, key, value);
                    updatedCount++;
                }
            }
        }

        if (updatedCount > 0) {
            console.log(`Writing ${updatedCount} actual updates to ${lang}.json...`);
            // Write with indentation to keep git diff clean
            fs.writeFileSync(filePath, JSON.stringify(jsonContent, null, 2), 'utf-8');
        } else {
            console.log(`No changes for ${lang}.json`);
        }
    }

    // 4. Update Meta File
    // Use the latest updated_at from received changes to capture the exact sync point
    // OR just use now(). Using now() is safer to avoid gaps if clocks skew slightly, 
    // but relying on DB time for future pulls is best practice. 
    // However, since we fetch * > lastSync, if we set lastSync=now(), we assume we fetched everything.
    const now = new Date().toISOString();
    fs.writeFileSync(META_FILE, JSON.stringify({ last_sync: now }, null, 2), 'utf-8');
    console.log(`✅ Sync Completed. Meta updated to ${now}`);
}

pull();
