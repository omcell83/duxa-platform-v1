'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import path from 'path'
import fs from 'fs/promises'

// Note: Local FS is mainly used for Sync Status check. 
// Writing is now done to Supabase DB directly.
const I18N_PATH = path.join(process.cwd(), 'i18n')

export interface SupportedLanguage {
    id: string
    code: string
    name: string
    is_active: boolean
    show_in_admin: boolean
    show_in_marketing: boolean
    show_in_online_menu: boolean
    flag_icon: string | null
}

export interface SyncStatus {
    missingInDb: string[] // Files that exist but not in DB
    missingInFile: string[] // DB entries that exist but no file
}

const LANGUAGE_NAMES: Record<string, string> = {
    bg: "Bulgarca",
    bs: "Boşnakça",
    de: "Almanca",
    el: "Yunanca",
    en: "İngilizce",
    es: "İspanyolca",
    fr: "Fransızca",
    hr: "Hırvatça",
    it: "İtalyanca",
    lb: "Lüksemburgca",
    me: "Karadağca",
    mt: "Maltaca",
    nl: "Flemenkçe",
    pl: "Lehçe",
    ro: "Romence",
    ru: "Rusça",
    sq: "Arnavutça",
    sr: "Sırpça",
    tr: "Türkçe",
    uk: "Ukraynaca"
};

export async function getLanguages() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('supported_languages')
        .select('*')
        .order('name')

    if (error) throw error
    return data as SupportedLanguage[]
}

export async function getSyncStatus(): Promise<SyncStatus> {
    const supabase = await createClient()

    // Get DB Languages
    const { data: dbLangs } = await supabase
        .from('supported_languages')
        .select('code')

    const dbCodes = new Set(dbLangs?.map(l => l.code) || [])

    // Get File Languages
    let files: string[] = []
    try {
        files = await fs.readdir(I18N_PATH)
    } catch (e) {
        console.error("i18n directory check failed", e)
        return { missingInDb: [], missingInFile: [] }
    }

    const fileCodes = new Set(files
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace('.json', '')))

    const missingInDb = [...fileCodes].filter(x => !dbCodes.has(x))
    const missingInFile = [...dbCodes].filter(x => !fileCodes.has(x))

    return { missingInDb, missingInFile }
}

export async function syncLanguageToDb(code: string) {
    const name = LANGUAGE_NAMES[code] || code.toUpperCase();
    const supabase = await createClient()

    // Check if exists
    const { data } = await supabase.from('supported_languages').select('id').eq('code', code).single()

    if (!data) {
        await supabase.from('supported_languages').insert({
            code,
            name,
            is_active: true
        })
    }
    revalidatePath('/super-admin/settings/translations')
}

export async function removeLanguageFromDb(code: string) {
    const supabase = await createClient()
    await supabase.from('supported_languages').delete().eq('code', code)
    revalidatePath('/super-admin/settings/translations')
}

/**
 * Gets translation file. 
 * NOTE: For "Master DB" architecture, we should ideally fetch from DB.
 * However, to keep reading fast and consistent with local dev, we check DB first, 
 * if empty or error (e.g. key missing locally), we might fallback.
 * But user requested "Advanced Translation System".
 * 
 * Let's change this to read from DB 'translations' table constructed as JSON.
 * But we need the nested structure.
 * 
 * Constructing big JSON from DB rows might be heavy if done excessively.
 * But 'migrated' structure is flat in DB. UI expects Nested.
 * 
 * Better approach for Editor:
 * 1. Fetch all rows from 'translations' (key, code_value).
 * 2. Unflatten to object.
 */
export async function getTranslationFile(langCode: string) {
    const supabase = await createClient();

    // Fetch all translations for this language
    const { data, error } = await supabase
        .from('translations')
        .select(`key, ${langCode}`)
        .not(langCode, 'is', null) // Filter where not null if desired, or fetch all

    if (error) {
        console.error('DB Fetch Error:', error);
        return {};
    }

    // Convert to Nested Object
    const result = {};
    data.forEach(row => {
        const val = row[langCode as keyof typeof row];
        if (val) {
            // Simple unflatten logic or use a library if we had one here (we don't import lodash in server actions usually unless installed)
            // We can do a simple split.
            const keys = row.key.split('.');
            let current: any = result;
            for (let i = 0; i < keys.length; i++) {
                const k = keys[i];
                if (i === keys.length - 1) {
                    current[k] = val;
                } else {
                    current[k] = current[k] || {};
                    current = current[k];
                }
            }
        }
    });

    return result;
}

/**
 * Update a specific translation key in DB.
 * Used by the Editor when user saves.
 */
export async function saveTranslationFile(langCode: string, content: any) {
    const supabase = await createClient();

    // The 'content' is nested JSON. We need to flatten it to update specific keys.
    const flatten = (obj: any, prefix = ''): Record<string, string> => {
        const acc: Record<string, string> = {};
        for (const key in obj) {
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                Object.assign(acc, flatten(obj[key], prefix ? `${prefix}.${key}` : key));
            } else {
                acc[prefix ? `${prefix}.${key}` : key] = String(obj[key]);
            }
        }
        return acc;
    }

    const flatContent = flatten(content);

    // We need to upsert each key.
    // NOTE: This might be heavy if saving WHOLE file.
    // The editor sends the whole file? Yes 'saveLanguage' does.
    // Optimize: Only send changed keys? 
    // For now, let's upsert all keys found in content.

    const updates = Object.entries(flatContent).map(([key, value]) => ({
        key,
        [langCode]: value,
        updated_at: new Date().toISOString()
    }));

    // Batch upsert
    const chunkSize = 100;
    for (let i = 0; i < updates.length; i += chunkSize) {
        const chunk = updates.slice(i, i + chunkSize);
        await supabase.from('translations').upsert(chunk, { onConflict: 'key' });
    }

    revalidatePath('/super-admin/settings/translations');
    return { success: true };
}

export async function updateLanguageSettings(id: string, settings: Partial<SupportedLanguage>) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('supported_languages')
        .update(settings)
        .eq('id', id)

    if (error) throw error
    revalidatePath('/super-admin/settings/translations')
}
