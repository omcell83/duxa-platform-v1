import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Translation provider types
type TranslationProvider = "google" | "azure" | "deepl" | "openai" | "gemini";

interface TranslationRequest {
    sourceData: Record<string, any>;
    targetLanguage: string;
    provider: TranslationProvider;
    apiKey?: string;
}

interface TranslationProgress {
    path: string;
    source: string;
    translated: string;
}

// Language mappings
const LANGUAGE_NAMES: Record<string, string> = {
    en: "English",
    de: "German",
    fr: "French",
    lb: "Luxembourgish",
    tr: "Turkish",
    me: "Montenegrin",
    mt: "Maltese",
    ru: "Russian",
};

const GOOGLE_LANG_CODES: Record<string, string> = {
    en: "en", de: "de", fr: "fr", lb: "lb", tr: "tr", me: "sr", mt: "mt", ru: "ru",
};

// Batch configurations
const BATCH_SIZE_SHORT = 50; // For Google/Azure (short texts)
const BATCH_SIZE_LONG = 10;  // For AI providers (long texts)
const DELAY_BETWEEN_BATCHES = 500;

/**
 * Hybrid translation system with multiple providers
 */
export async function POST(request: NextRequest) {
    try {
        const { sourceData, targetLanguage, provider, apiKey }: TranslationRequest = await request.json();

        if (!sourceData || !targetLanguage || !provider) {
            return NextResponse.json(
                { error: "Missing required parameters" },
                { status: 400 }
            );
        }

        const targetLangName = LANGUAGE_NAMES[targetLanguage] || targetLanguage;

        // Collect all strings to translate
        const stringsToTranslate: Array<{ path: string; text: string; isLong: boolean }> = [];
        collectStrings(sourceData, "", stringsToTranslate);

        console.log(`Starting translation of ${stringsToTranslate.length} items to ${targetLangName} using ${provider}`);

        // Separate short and long texts
        const shortTexts = stringsToTranslate.filter(item => !item.isLong);
        const longTexts = stringsToTranslate.filter(item => item.isLong);

        console.log(`Short texts: ${shortTexts.length}, Long texts: ${longTexts.length}`);

        const translations = new Map<string, string>();

        // Translate short texts with Google/Azure (fast and cheap)
        if (shortTexts.length > 0) {
            const shortTranslations = await translateBatch(
                shortTexts,
                targetLanguage,
                "google", // Always use Google for short texts
                undefined
            );
            shortTranslations.forEach((value, key) => translations.set(key, value));
        }

        // Translate long texts with selected AI provider
        if (longTexts.length > 0) {
            const longTranslations = await translateBatch(
                longTexts,
                targetLanguage,
                provider,
                apiKey
            );
            longTranslations.forEach((value, key) => translations.set(key, value));
        }

        // Reconstruct the object with translations
        const translatedData = reconstructObject(sourceData, translations);

        return NextResponse.json(translatedData);
    } catch (error: any) {
        console.error("Translation error:", error);
        return NextResponse.json(
            { error: error.message || "Translation failed" },
            { status: 500 }
        );
    }
}

/**
 * Collects all string values and categorizes them as short or long
 */
function collectStrings(
    obj: any,
    currentPath: string,
    result: Array<{ path: string; text: string; isLong: boolean }>
): void {
    if (typeof obj === "string") {
        if (obj.trim() !== "" && /[a-zA-Z]/.test(obj)) {
            // Categorize: Long if > 50 chars or contains marketing keywords
            const isLong = obj.length > 50 || isMarketingContent(currentPath);
            result.push({ path: currentPath, text: obj, isLong });
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
 * Determines if content is marketing/creative content
 */
function isMarketingContent(path: string): boolean {
    const marketingPaths = [
        "seo.",
        "marketing.",
        "carousel.",
        "description",
        "welcomeDesc",
        "features.",
        "blog.",
    ];
    return marketingPaths.some(p => path.includes(p));
}

/**
 * Translates a batch of items using the specified provider
 */
async function translateBatch(
    items: Array<{ path: string; text: string; isLong: boolean }>,
    targetLang: string,
    provider: TranslationProvider,
    apiKey?: string
): Promise<Map<string, string>> {
    const translations = new Map<string, string>();
    const batchSize = provider === "google" || provider === "azure" ? BATCH_SIZE_SHORT : BATCH_SIZE_LONG;

    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);

        try {
            const batchTranslations = await translateWithProvider(
                batch.map(item => item.text),
                targetLang,
                provider,
                apiKey
            );

            batch.forEach((item, index) => {
                translations.set(item.path, batchTranslations[index] || item.text);
            });

            if (i + batchSize < items.length) {
                await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
            }

            console.log(`Translated ${Math.min(i + batchSize, items.length)} / ${items.length} items with ${provider}`);
        } catch (error) {
            console.error(`Batch translation failed with ${provider}:`, error);
            batch.forEach((item) => {
                translations.set(item.path, item.text);
            });
        }
    }

    return translations;
}

/**
 * Translates texts using the specified provider
 */
async function translateWithProvider(
    texts: string[],
    targetLang: string,
    provider: TranslationProvider,
    apiKey?: string
): Promise<string[]> {
    switch (provider) {
        case "google":
            return translateWithGoogle(texts, targetLang);
        case "azure":
            return translateWithAzure(texts, targetLang, apiKey);
        case "deepl":
            return translateWithDeepL(texts, targetLang, apiKey);
        case "openai":
            return translateWithOpenAI(texts, targetLang, apiKey);
        case "gemini":
            return translateWithGemini(texts, targetLang, apiKey);
        default:
            return texts;
    }
}

/**
 * Google Translate (Free, unlimited)
 */
async function translateWithGoogle(
    texts: string[],
    targetLang: string
): Promise<string[]> {
    const results: string[] = [];

    for (const text of texts) {
        try {
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${GOOGLE_LANG_CODES[targetLang]}&dt=t&q=${encodeURIComponent(text)}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data && data[0] && data[0][0] && data[0][0][0]) {
                results.push(data[0][0][0]);
            } else {
                results.push(text);
            }
        } catch (error) {
            results.push(text);
        }
    }

    return results;
}

/**
 * Azure Translator (2M chars/month free)
 */
async function translateWithAzure(
    texts: string[],
    targetLang: string,
    apiKey?: string
): Promise<string[]> {
    if (!apiKey) {
        throw new Error("Azure API key required");
    }

    const response = await fetch(
        `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=${targetLang}`,
        {
            method: "POST",
            headers: {
                "Ocp-Apim-Subscription-Key": apiKey,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(texts.map(text => ({ text }))),
        }
    );

    const data = await response.json();
    return data.map((item: any) => item.translations[0].text);
}

/**
 * DeepL (500K chars/month free)
 */
async function translateWithDeepL(
    texts: string[],
    targetLang: string,
    apiKey?: string
): Promise<string[]> {
    if (!apiKey) {
        throw new Error("DeepL API key required");
    }

    const response = await fetch("https://api-free.deepl.com/v2/translate", {
        method: "POST",
        headers: {
            "Authorization": `DeepL-Auth-Key ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            text: texts,
            target_lang: targetLang.toUpperCase(),
            formality: "default",
            preserve_formatting: true,
        }),
    });

    const data = await response.json();
    return data.translations.map((t: any) => t.text);
}

/**
 * OpenAI GPT (Pay per use)
 */
async function translateWithOpenAI(
    texts: string[],
    targetLang: string,
    apiKey?: string
): Promise<string[]> {
    if (!apiKey) {
        throw new Error("OpenAI API key required");
    }

    const openai = new OpenAI({ apiKey });
    const targetLangName = LANGUAGE_NAMES[targetLang];

    const prompt = `Translate these English texts to ${targetLangName} for a restaurant/hospitality app.

RULES:
1. Natural, human-like translations (not literal)
2. Keep placeholders like {name}, {count} unchanged
3. Preserve HTML tags
4. Maintain tone and formatting
5. Return only translations, one per line

Texts:
${texts.map((text, i) => `${i + 1}. ${text}`).join('\n')}`;

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: "You are a professional translator. Return only translations, one per line." },
            { role: "user", content: prompt }
        ],
        temperature: 0.3,
    });

    const translatedText = response.choices[0]?.message?.content || "";
    const lines = translatedText.split('\n')
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(line => line.length > 0);

    while (lines.length < texts.length) {
        lines.push(texts[lines.length]);
    }

    return lines;
}

/**
 * Google Gemini (Free tier available)
 */
async function translateWithGemini(
    texts: string[],
    targetLang: string,
    apiKey?: string
): Promise<string[]> {
    if (!apiKey) {
        throw new Error("Gemini API key required");
    }

    const targetLangName = LANGUAGE_NAMES[targetLang];

    const prompt = `Translate these English texts to ${targetLangName} for a restaurant app.

RULES:
1. Natural translations
2. Keep {placeholders} unchanged
3. Preserve HTML tags
4. Return only translations, one per line

Texts:
${texts.map((text, i) => `${i + 1}. ${text}`).join('\n')}`;

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.3 },
            }),
        }
    );

    const data = await response.json();
    const translatedText = data.candidates[0]?.content?.parts[0]?.text || "";
    const lines = translatedText.split('\n')
        .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
        .filter((line: string) => line.length > 0);

    while (lines.length < texts.length) {
        lines.push(texts[lines.length]);
    }

    return lines;
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
