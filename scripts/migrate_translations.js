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

// Use Service Key if available to bypass RLS, otherwise Anon (might fail if RLS blocks write)
const supabase = createClient(SUPABASE_URL, SERVICE_KEY || SUPABASE_KEY);

const I18N_PATH = path.join(__dirname, '../i18n');
const LANGUAGES = [
    'en', 'tr', 'de', 'fr', 'lb', 'me', 'mt', 'ru', 'nl',
    'sr', 'hr', 'bs', 'sq', 'uk', 'pl', 'it', 'es', 'el', 'bg', 'ro'
];

// Helper: Flatten Object to Dot Notation
function flattenObject(obj, prefix = '') {
    const result = {};
    for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            Object.assign(result, flattenObject(obj[key], prefix ? `${prefix}.${key}` : key));
        } else {
            result[prefix ? `${prefix}.${key}` : key] = String(obj[key]);
        }
    }
    return result;
}

async function migrate() {
    console.log('🚀 Starting Translation Migration...');

    // 1. Read and Flatten all JSON files
    const flatData = {}; // { 'nav.login': { en: 'Login', tr: 'Giriş' } }

    for (const lang of LANGUAGES) {
        const filePath = path.join(I18N_PATH, `${lang}.json`);
        if (fs.existsSync(filePath)) {
            console.log(`Reading ${lang}.json...`);
            try {
                const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                const flat = flattenObject(content);

                for (const [key, value] of Object.entries(flat)) {
                    if (!flatData[key]) flatData[key] = {};
                    flatData[key][lang] = value;
                }
            } catch (e) {
                console.error(`Error reading ${lang}.json:`, e.message);
            }
        }
    }

    // 2. Prepare Data for Upsert
    const upsertPayload = Object.entries(flatData).map(([key, langs]) => ({
        key,
        updated_at: new Date().toISOString(),
        ...langs
    }));

    console.log(`\nFound ${upsertPayload.length} unique translation keys.`);
    console.log('Pushing to Supabase (this may take a moment)...');

    // 3. Batch Upsert (Supabase has limit on request size, so chunk it)
    const CHUNK_SIZE = 100;
    for (let i = 0; i < upsertPayload.length; i += CHUNK_SIZE) {
        const chunk = upsertPayload.slice(i, i + CHUNK_SIZE);

        const { error } = await supabase
            .from('translations')
            .upsert(chunk, { onConflict: 'key' });

        if (error) {
            console.error('Migration Error:', error);
        } else {
            console.log(`Processed ${i + chunk.length}/${upsertPayload.length}`);
        }
    }

    console.log('\n✅ Migration Complete!');
}

migrate();
