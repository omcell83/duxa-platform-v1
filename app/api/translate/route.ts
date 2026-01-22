import { NextRequest, NextResponse } from "next/server";

// Language code mapping for Google Translate
const LANGUAGE_MAP: Record<string, string> = {
    en: "en",
    de: "de",
    fr: "fr",
    lb: "lb",
    tr: "tr",
    me: "sr", // Montenegrin -> Serbian (closest)
    mt: "mt",
    ru: "ru",
};

interface TranslationRequest {
    sourceData: Record<string, any>;
    targetLanguage: string;
}

// Batch size for translation requests
const BATCH_SIZE = 50;
const DELAY_BETWEEN_BATCHES = 500; // 500ms delay

/**
 * Translates nested JSON object using Google Translate unofficial API
 */
export async function POST(request: NextRequest) {
    try {
        const { sourceData, targetLanguage }: TranslationRequest = await request.json();

        if (!sourceData || !targetLanguage) {
            return NextResponse.json(
                { error: "Missing required parameters" },
                { status: 400 }
            );
        }

        const targetLangCode = LANGUAGE_MAP[targetLanguage] || targetLanguage;

        // Collect all strings to translate
        const stringsToTranslate: Array<{ path: string; text: string }> = [];
        collectStrings(sourceData, "", stringsToTranslate);

        console.log(`Starting translation of ${stringsToTranslate.length} items to ${targetLanguage}`);

        // Translate in batches
        const translations = await translateInBatches(
            stringsToTranslate,
            "en",
            targetLangCode
        );

        // Reconstruct the object with translations
        const translatedData = reconstructObject(sourceData, translations);

        return NextResponse.json(translatedData);
    } catch (error) {
        console.error("Translation error:", error);
        return NextResponse.json(
            { error: "Translation failed" },
            { status: 500 }
        );
    }
}

/**
 * Collects all string values from nested object with their paths
 */
function collectStrings(
    obj: any,
    currentPath: string,
    result: Array<{ path: string; text: string }>
): void {
    if (typeof obj === "string") {
        if (obj.trim() !== "" && /[a-zA-Z]/.test(obj)) {
            result.push({ path: currentPath, text: obj });
        }
        return;
    }

    if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
            collectStrings(item, `${currentPath}[${index}]`, result);
        });
        return;
    }

    if (typeof obj === "object" && obj !== null) {
        for (const key in obj) {
            const newPath = currentPath ? `${currentPath}.${key}` : key;
            collectStrings(obj[key], newPath, result);
        }
    }
}

/**
 * Translates strings in batches to improve performance
 */
async function translateInBatches(
    items: Array<{ path: string; text: string }>,
    sourceLang: string,
    targetLang: string
): Promise<Map<string, string>> {
    const translations = new Map<string, string>();

    // Process in batches
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batch = items.slice(i, i + BATCH_SIZE);

        // Translate batch concurrently
        const batchPromises = batch.map(async (item) => {
            const translated = await translateText(item.text, sourceLang, targetLang);
            return { path: item.path, translated };
        });

        const batchResults = await Promise.all(batchPromises);

        // Store results
        batchResults.forEach(({ path, translated }) => {
            translations.set(path, translated);
        });

        // Add delay between batches to avoid rate limiting
        if (i + BATCH_SIZE < items.length) {
            await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
        }

        // Log progress
        console.log(`Translated ${Math.min(i + BATCH_SIZE, items.length)} / ${items.length} items`);
    }

    return translations;
}

/**
 * Reconstructs the original object structure with translated values
 */
function reconstructObject(
    original: any,
    translations: Map<string, string>,
    currentPath: string = ""
): any {
    if (typeof original === "string") {
        return translations.get(currentPath) || original;
    }

    if (Array.isArray(original)) {
        return original.map((item, index) =>
            reconstructObject(item, translations, `${currentPath}[${index}]`)
        );
    }

    if (typeof original === "object" && original !== null) {
        const result: Record<string, any> = {};
        for (const key in original) {
            const newPath = currentPath ? `${currentPath}.${key}` : key;
            result[key] = reconstructObject(original[key], translations, newPath);
        }
        return result;
    }

    return original;
}

/**
 * Translates a single text string using Google Translate unofficial API
 */
async function translateText(
    text: string,
    sourceLang: string,
    targetLang: string
): Promise<string> {
    try {
        // Skip empty strings
        if (!text || text.trim() === "") {
            return text;
        }

        // Skip if text contains only special characters or numbers
        if (!/[a-zA-Z]/.test(text)) {
            return text;
        }

        // Use Google Translate unofficial API
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

        const response = await fetch(url);

        if (!response.ok) {
            console.error(`Translation failed for: ${text}`);
            return text; // Return original text if translation fails
        }

        const data = await response.json();

        // Google Translate returns array of arrays: [[[translated, original, ...]]]
        if (data && data[0] && data[0][0] && data[0][0][0]) {
            return data[0][0][0];
        }

        return text;
    } catch (error) {
        console.error(`Error translating "${text}":`, error);
        return text; // Return original text on error
    }
}
