import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

type TranslationProvider = "mymemory" | "azure" | "deepl" | "openai" | "gemini";

interface TranslationRequest {
    sourceData: Record<string, any>;
    targetLanguage: string;
    provider: TranslationProvider;
    apiKey?: string;
    existingTranslations?: Record<string, any>;
}

interface TranslationProgress {
    path: string;
    source: string;
    translated: string;
}

// Language mappings
const LANGUAGE_NAMES: Record<string, string> = {
    en: "English", de: "German", fr: "French", lb: "Luxembourgish",
    tr: "Turkish", me: "Montenegrin", mt: "Maltese", ru: "Russian",
};

// MyMemory uses different codes
const MYMEMORY_CODES: Record<string, string> = {
    en: "en-GB", de: "de-DE", fr: "fr-FR", lb: "de-DE", // Luxembourgish -> German
    tr: "tr-TR", me: "sr-SP", mt: "mt-MT", ru: "ru-RU",
};

const LANG_CODES: Record<string, string> = {
    en: "en", de: "de", fr: "fr", lb: "lb", tr: "tr", me: "sr", mt: "mt", ru: "ru",
};

// Protected terms that should never be translated
const PROTECTED_TERMS = [
    "digifoodz", "Digifoodz", "DIGIFOODZ",
    "duxa", "Duxa", "DUXA",
    "POS", "QR", "API", "URL", "SEO",
];

const BATCH_SIZE_SHORT = 20;
const BATCH_SIZE_LONG = 5;
const DELAY_BETWEEN_BATCHES = 1000;

export async function POST(request: NextRequest) {
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Start streaming response
    const responsePromise = (async () => {
        try {
            const { sourceData, targetLanguage, provider, apiKey, existingTranslations }: TranslationRequest = await request.json();

            if (!sourceData || !targetLanguage || !provider) {
                await writer.write(encoder.encode(`data: ${JSON.stringify({ error: "Missing parameters" })}\n\n`));
                await writer.close();
                return;
            }

            const targetLangName = LANGUAGE_NAMES[targetLanguage] || targetLanguage;

            // Collect strings that need translation
            const stringsToTranslate: Array<{ path: string; text: string; isLong: boolean }> = [];
            collectStringsToTranslate(sourceData, existingTranslations || {}, "", stringsToTranslate);

            await writer.write(encoder.encode(`data: ${JSON.stringify({
                type: "info",
                message: `${stringsToTranslate.length} anahtar çevrilecek`
            })}\n\n`));

            // Separate short and long texts
            const shortTexts = stringsToTranslate.filter(item => !item.isLong);
            const longTexts = stringsToTranslate.filter(item => item.isLong);

            await writer.write(encoder.encode(`data: ${JSON.stringify({
                type: "info",
                message: `Kısa: ${shortTexts.length}, Uzun: ${longTexts.length}`
            })}\n\n`));

            const translations = new Map<string, string>();

            // Translate short texts
            if (shortTexts.length > 0) {
                await translateBatchStreaming(shortTexts, targetLanguage, "mymemory", undefined, translations, writer, encoder);
            }

            // Translate long texts
            if (longTexts.length > 0) {
                await translateBatchStreaming(longTexts, targetLanguage, provider, apiKey, translations, writer, encoder);
            }

            // Merge with existing translations
            const finalData = mergeTranslations(sourceData, existingTranslations || {}, translations);

            // Send final result
            await writer.write(encoder.encode(`data: ${JSON.stringify({
                type: "complete",
                data: finalData
            })}\n\n`));

        } catch (error: any) {
            console.error("Translation error:", error);
            await writer.write(encoder.encode(`data: ${JSON.stringify({
                type: "error",
                message: error.message
            })}\n\n`));
        } finally {
            await writer.close();
        }
    })();

    return new Response(stream.readable, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    });
}

/**
 * Collects only strings that need translation (missing in existing translations)
 */
function collectStringsToTranslate(
    source: any,
    existing: any,
    currentPath: string,
    result: Array<{ path: string; text: string; isLong: boolean }>
): void {
    if (typeof source === "string") {
        if (source.trim() !== "" && /[a-zA-Z]/.test(source)) {
            // Check if translation already exists
            const existingValue = getNestedValue(existing, currentPath);
            if (!existingValue || existingValue === source) {
                const isLong = source.length > 50 || isMarketingContent(currentPath);
                result.push({ path: currentPath, text: source, isLong });
            }
        }
        return;
    }

    if (Array.isArray(source)) {
        source.forEach((item, index) => {
            collectStringsToTranslate(item, existing, `${currentPath}[${index}]`, result);
        });
        return;
    }

    if (typeof source === "object" && source !== null) {
        for (const key in source) {
            const newPath = currentPath ? `${currentPath}.${key}` : key;
            collectStringsToTranslate(source[key], existing, newPath, result);
        }
    }
}

function getNestedValue(obj: any, path: string): any {
    if (!path) return obj;
    return path.split('.').reduce((current, key) => {
        if (current === undefined || current === null) return undefined;
        // Handle array indices
        const arrayMatch = key.match(/^(.+)\[(\d+)\]$/);
        if (arrayMatch) {
            const [, arrayKey, index] = arrayMatch;
            return current[arrayKey]?.[parseInt(index)];
        }
        return current[key];
    }, obj);
}

function isMarketingContent(path: string): boolean {
    const marketingPaths = ["seo.", "marketing.", "carousel.", "description", "welcomeDesc", "features.", "blog."];
    return marketingPaths.some(p => path.includes(p));
}

async function translateBatchStreaming(
    items: Array<{ path: string; text: string; isLong: boolean }>,
    targetLang: string,
    provider: TranslationProvider,
    apiKey: string | undefined,
    translations: Map<string, string>,
    writer: WritableStreamDefaultWriter,
    encoder: TextEncoder
): Promise<void> {
    const batchSize = provider === "mymemory" ? BATCH_SIZE_SHORT : BATCH_SIZE_LONG;
    const totalBatches = Math.ceil(items.length / batchSize);

    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchNum = Math.floor(i / batchSize) + 1;

        try {
            await writer.write(encoder.encode(`data: ${JSON.stringify({
                type: "progress",
                message: `Batch ${batchNum}/${totalBatches} çevriliyor (${provider})...`,
                current: i,
                total: items.length
            })}\n\n`));

            const batchTranslations = await translateWithProvider(
                batch.map(item => item.text),
                targetLang,
                provider,
                apiKey
            );

            batch.forEach((item, index) => {
                const translated = batchTranslations[index] || item.text;
                translations.set(item.path, translated);

                // Send each translation immediately
                writer.write(encoder.encode(`data: ${JSON.stringify({
                    type: "translation",
                    path: item.path,
                    source: item.text,
                    translated: translated
                })}\n\n`));
            });

            if (i + batchSize < items.length) {
                await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
            }

        } catch (error: any) {
            console.error(`Batch ${batchNum} failed:`, error);
            await writer.write(encoder.encode(`data: ${JSON.stringify({
                type: "error",
                message: `Batch ${batchNum} hatası: ${error.message}`
            })}\n\n`));

            // Keep original texts on error
            batch.forEach((item) => {
                translations.set(item.path, item.text);
            });
        }
    }
}

async function translateWithProvider(
    texts: string[],
    targetLang: string,
    provider: TranslationProvider,
    apiKey?: string
): Promise<string[]> {
    switch (provider) {
        case "mymemory":
            return translateWithMyMemory(texts, targetLang);
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

async function translateWithMyMemory(texts: string[], targetLang: string): Promise<string[]> {
    const results: string[] = [];

    for (const text of texts) {
        try {
            if (!text || text.trim().length < 2) {
                results.push(text);
                continue;
            }

            // Protect special terms
            const protectedText = protectTerms(text);

            const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(protectedText)}&langpair=en|${MYMEMORY_CODES[targetLang] || LANG_CODES[targetLang]}`;

            const response = await fetch(url);
            if (!response.ok) {
                console.error(`MyMemory error: ${response.status}`);
                results.push(text);
                continue;
            }

            const data = await response.json();

            if (data?.responseData?.translatedText) {
                const translated = unprotectTerms(data.responseData.translatedText);
                results.push(translated);
            } else {
                console.warn(`No translation for: ${text}`);
                results.push(text);
            }

            await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
            console.error(`MyMemory translation error:`, error);
            results.push(text);
        }
    }

    return results;
}

/**
 * Protect special terms and variables from translation
 */
function protectTerms(text: string): string {
    let protectedText = text;

    // Protect variables like {name}, {count}, etc.
    protectedText = protectedText.replace(/\{([^}]+)\}/g, '___VAR_$1___');

    // Protect brand names and special terms
    PROTECTED_TERMS.forEach((term, index) => {
        const regex = new RegExp(`\\b${term}\\b`, 'gi');
        protectedText = protectedText.replace(regex, `___TERM${index}___`);
    });

    return protectedText;
}

/**
 * Restore protected terms after translation
 */
function unprotectTerms(text: string): string {
    let unprotectedText = text;

    // Restore variables
    unprotectedText = unprotectedText.replace(/___VAR_([^_]+)___/g, '{$1}');

    // Restore brand names
    PROTECTED_TERMS.forEach((term, index) => {
        const regex = new RegExp(`___TERM${index}___`, 'g');
        unprotectedText = unprotectedText.replace(regex, term);
    });

    return unprotectedText;
}

async function translateWithAzure(texts: string[], targetLang: string, apiKey?: string): Promise<string[]> {
    if (!apiKey) throw new Error("Azure API key required");

    const protectedTexts = texts.map(protectTerms);

    const response = await fetch(
        `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=${targetLang}`,
        {
            method: "POST",
            headers: {
                "Ocp-Apim-Subscription-Key": apiKey,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(protectedTexts.map(text => ({ text }))),
        }
    );

    const data = await response.json();
    return data.map((item: any) => unprotectTerms(item.translations[0].text));
}

async function translateWithDeepL(texts: string[], targetLang: string, apiKey?: string): Promise<string[]> {
    if (!apiKey) throw new Error("DeepL API key required");

    const protectedTexts = texts.map(protectTerms);

    const response = await fetch("https://api-free.deepl.com/v2/translate", {
        method: "POST",
        headers: {
            "Authorization": `DeepL-Auth-Key ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            text: protectedTexts,
            target_lang: targetLang.toUpperCase(),
            formality: "default",
            preserve_formatting: true,
            tag_handling: "xml",
        }),
    });

    const data = await response.json();
    return data.translations.map((t: any) => unprotectTerms(t.text));
}

async function translateWithOpenAI(texts: string[], targetLang: string, apiKey?: string): Promise<string[]> {
    if (!apiKey) throw new Error("OpenAI API key required");

    const openai = new OpenAI({ apiKey });
    const targetLangName = LANGUAGE_NAMES[targetLang];

    const protectedList = PROTECTED_TERMS.join(", ");

    const prompt = `Translate these English texts to ${targetLangName} for a restaurant/hospitality application.

CRITICAL RULES:
1. Natural, contextual translations (NOT literal/dictionary translations)
2. NEVER translate these terms: ${protectedList}
3. NEVER translate variables in curly braces like {name}, {count}, {businessName}
4. Preserve HTML tags exactly
5. Maintain tone and formatting
6. Use restaurant/hospitality industry terminology
7. Return ONLY translations, one per line, no numbering

Texts to translate:
${texts.map((text, i) => `${i + 1}. ${text}`).join('\n')}

Translations (one per line):`;

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: `You are a professional translator specializing in restaurant and hospitality industry. You provide natural, contextual translations, not literal dictionary translations. You NEVER translate brand names, technical terms, or variables in {curly braces}.`
            },
            { role: "user", content: prompt }
        ],
        temperature: 0.3,
    });

    const translatedText = response.choices[0]?.message?.content || "";
    const lines = translatedText.split('\n')
        .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
        .filter((line: string) => line.length > 0);

    while (lines.length < texts.length) {
        lines.push(texts[lines.length]);
    }

    return lines;
}

async function translateWithGemini(texts: string[], targetLang: string, apiKey?: string): Promise<string[]> {
    if (!apiKey) throw new Error("Gemini API key required");

    const targetLangName = LANGUAGE_NAMES[targetLang];
    const protectedList = PROTECTED_TERMS.join(", ");

    const prompt = `Translate to ${targetLangName} for a restaurant app.

RULES:
1. Natural, contextual translations (NOT dictionary)
2. NEVER translate: ${protectedList}
3. NEVER translate {variables}
4. Preserve HTML tags
5. Return only translations, one per line

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
 * Merges new translations with existing ones
 */
function mergeTranslations(
    source: any,
    existing: any,
    newTranslations: Map<string, string>,
    currentPath: string = ""
): any {
    if (typeof source === "string") {
        // Use new translation if available, otherwise use existing, otherwise use source
        return newTranslations.get(currentPath) || getNestedValue(existing, currentPath) || source;
    }

    if (Array.isArray(source)) {
        return source.map((item, index) =>
            mergeTranslations(item, existing, newTranslations, `${currentPath}[${index}]`)
        );
    }

    if (typeof source === "object" && source !== null) {
        const result: Record<string, any> = {};
        for (const key in source) {
            const newPath = currentPath ? `${currentPath}.${key}` : key;
            result[key] = mergeTranslations(source[key], existing, newTranslations, newPath);
        }
        return result;
    }

    return source;
}
