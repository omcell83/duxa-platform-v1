import { NextRequest, NextResponse } from "next/server";

// Language code mapping for LibreTranslate
const LANGUAGE_MAP: Record<string, string> = {
    en: "en",
    de: "de",
    fr: "fr",
    lb: "de", // Luxembourgish -> German (closest alternative)
    tr: "tr",
    me: "sr", // Montenegrin -> Serbian (very similar)
    mt: "en", // Maltese -> fallback to English (limited support)
    ru: "ru",
};

interface TranslationRequest {
    sourceData: Record<string, any>;
    targetLanguage: string;
}

// Batch size for translation requests
const BATCH_SIZE = 50;
const DELAY_BETWEEN_BATCHES = 1000; // 1 second delay to avoid rate limiting

/**
 * Translates nested JSON object using LibreTranslate API
 * LibreTranslate is a free and open-source machine translation API
 * Public instance: https://libretranslate.com
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
 * Translates a single text string using LibreTranslate
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

        // Use public LibreTranslate instance
        const response = await fetch("https://libretranslate.com/translate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                q: text,
                source: sourceLang,
                target: targetLang,
                format: "text",
            }),
        });

        if (!response.ok) {
            console.error(`Translation failed for: ${text}`);
            return text; // Return original text if translation fails
        }

        const data = await response.json();
        return data.translatedText || text;
    } catch (error) {
        console.error(`Error translating "${text}":`, error);
        return text; // Return original text on error
    }
}
