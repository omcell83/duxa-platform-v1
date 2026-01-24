const fs = require('fs');
const path = require('path');
require('dotenv').config();
const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const SOURCE_FILE = path.join(__dirname, '../i18n/en.json');
const TARGET_DIR = path.join(__dirname, '../i18n');
const CHUNK_SIZE = 150;

const TARGET_LANGUAGES = [
    //   { code: 'fr', name: 'French' },
    //   { code: 'lb', name: 'Luxembourgish' },
    //   { code: 'tr', name: 'Turkish' },
    //   { code: 'me', name: 'Montenegrin Latin Script' },
    //   { code: 'mt', name: 'Maltese' },
    //   { code: 'ru', name: 'Russian' },
    { code: 'nl', name: 'Dutch' },      // Felemenkçe
    { code: 'sr', name: 'Serbian (Latin Script)' },    // Sırpça
    { code: 'hr', name: 'Croatian' },   // Hırvatça
    { code: 'bs', name: 'Bosnian' },    // Boşnakça
    { code: 'sq', name: 'Albanian' },   // Arnavutça
    { code: 'uk', name: 'Ukrainian' },  // Ukraynaca
    { code: 'pl', name: 'Polish' },     // Lehçe
    { code: 'it', name: 'Italian' },    // İtalyanca
    { code: 'es', name: 'Spanish' },    // İspanyolca
    { code: 'el', name: 'Greek' },      // Yunanca
    { code: 'bg', name: 'Bulgarian' },  // Bulgarca
    { code: 'ro', name: 'Romanian' }    // Romence
];

const SYSTEM_PROMPT = `You are a localization expert for a tech platform named 'duxa.pro' and 'digifoodz.com'.
Do NOT translate variable placeholders like {count}, {days}, {0}, {{name}}, %s.
Do NOT translate brand names: 'duxa.pro', 'Duxa', 'Sandwich XL', 'digifoodz', 'digifood', . 
Do NOT translate specific technical terms or proper nouns unless appropriate.
Keep UI button translations concise and suitable for interface limits.
Output must be valid JSON only.`;

// Helper to flatten JSON object to dot notation
function flatten(data, prefix = '') {
    let result = {};
    for (const key in data) {
        if (typeof data[key] === 'object' && data[key] !== null && !Array.isArray(data[key])) {
            Object.assign(result, flatten(data[key], prefix + key + '.'));
        } else {
            result[prefix + key] = data[key];
        }
    }
    return result;
}

// Helper to unflatten dot notation back to nested object
function unflatten(data) {
    const result = {};
    for (const key in data) {
        const keys = key.split('.');
        let current = result;
        for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            if (i === keys.length - 1) {
                current[k] = data[key];
            } else {
                current[k] = current[k] || {};
                current = current[k];
            }
        }
    }
    return result;
}

async function translateChunk(chunkObj, langName, langCode) {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                {
                    role: "user",
                    content: `Translate the values of the following JSON object into ${langName} (${langCode}). \n\n${JSON.stringify(chunkObj, null, 2)}`
                }
            ],
            response_format: { type: "json_object" }
        });

        const content = completion.choices[0].message.content;
        return JSON.parse(content);
    } catch (error) {
        console.error(`Error translating chunk for ${langName}:`, error);
        return chunkObj; // Return original on error to preserve keys
    }
}

async function processLanguage(lang, flatSource) {
    console.log(`\nStarting translation for: ${lang.name} (${lang.code})`);

    const keys = Object.keys(flatSource);
    const totalChunks = Math.ceil(keys.length / CHUNK_SIZE);
    let translatedFlat = {};

    for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = start + CHUNK_SIZE;
        const chunkKeys = keys.slice(start, end);

        // Create chunk object
        const chunkObj = {};
        chunkKeys.forEach(k => chunkObj[k] = flatSource[k]);

        console.log(`Processing chunk ${i + 1}/${totalChunks} for ${lang.code}...`);

        const translatedChunk = await translateChunk(chunkObj, lang.name, lang.code);
        Object.assign(translatedFlat, translatedChunk);
    }

    // Unflatten and save
    const finalJson = unflatten(translatedFlat);
    const filePath = path.join(TARGET_DIR, `${lang.code}.json`);

    fs.writeFileSync(filePath, JSON.stringify(finalJson, null, 2), 'utf8');
    console.log(`Saved ${lang.code}.json`);
}

async function main() {
    try {
        if (!fs.existsSync(SOURCE_FILE)) {
            console.error(`Source file not found: ${SOURCE_FILE}`);
            process.exit(1);
        }

        console.log('Reading source file...');
        const sourceContent = fs.readFileSync(SOURCE_FILE, 'utf8');
        const sourceJson = JSON.parse(sourceContent);
        const flatSource = flatten(sourceJson);
        console.log(`Total keys to translate: ${Object.keys(flatSource).length}`);

        for (const lang of TARGET_LANGUAGES) {
            await processLanguage(lang, flatSource);
        }

        console.log('\nAll translations completed successfully!');
    } catch (err) {
        console.error('Fatal error:', err);
        process.exit(1);
    }
}

main();
