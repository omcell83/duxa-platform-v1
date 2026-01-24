'use server'

import { createClient } from '@/lib/supabase-server'
import fs from 'fs/promises'
import path from 'path'
import { revalidatePath } from 'next/cache'

const I18N_PATH = path.join(process.cwd(), 'i18n')

export interface SupportedLanguage {
    id: string
    code: string
    name: string
    is_active: boolean
    show_in_admin: boolean
    show_in_marketing: boolean
    show_in_online_menu: boolean
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

    // Check if exists first to avoid duplicate errors if race condition
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

export async function getTranslationFile(langCode: string) {
    try {
        const filePath = path.join(I18N_PATH, `${langCode}.json`)
        const content = await fs.readFile(filePath, 'utf-8')
        return JSON.parse(content)
    } catch (error) {
        return {}
    }
}

export async function saveTranslationFile(langCode: string, content: any) {
    const filePath = path.join(I18N_PATH, `${langCode}.json`)
    await fs.writeFile(filePath, JSON.stringify(content, null, 2), 'utf-8')
    return { success: true }
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
