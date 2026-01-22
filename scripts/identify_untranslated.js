const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../i18n/en.json');
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

const langs = ['de', 'es', 'mt'];
const results = {};

function isIdentical(obj1, obj2, keyPath = '') {
    let identicalKeys = [];
    for (const key in obj1) {
        const currentPath = keyPath ? `${keyPath}.${key}` : key;
        if (typeof obj1[key] === 'object' && obj1[key] !== null) {
            if (obj2[key]) {
                identicalKeys = identicalKeys.concat(isIdentical(obj1[key], obj2[key], currentPath));
            }
        } else {
            if (obj2 && obj2[key] === obj1[key] && typeof obj1[key] === 'string' && obj1[key].length > 4) {
                // heuristic: if string > 4 length and identical, it's likely untranslated
                identicalKeys.push(currentPath);
            }
        }
    }
    return identicalKeys;
}

const files = fs.readdirSync(path.join(__dirname, '../i18n')).filter(f => f.endsWith('.json') && f !== 'en.json' && !f.includes('_admin') && !f.includes('batch'));

files.forEach(file => {
    const lang = file.replace('.json', '');
    const langPath = path.join(__dirname, `../i18n/${file}`);
    const langContent = JSON.parse(fs.readFileSync(langPath, 'utf8'));

    // Count exact string matches for longer strings (likely untranslated)
    const untranslated = isIdentical(en, langContent);
    const totalKeys = Object.keys(flatten(en)).length;
    const untranslatedCount = untranslated.length;

    // Count missing keys
    const missing = getMissingKeys(en, langContent);

    results[lang] = {
        totalKeys: totalKeys,
        untranslatedCount: untranslatedCount,
        missingCount: missing.length,
        untranslatedPercent: ((untranslatedCount / totalKeys) * 100).toFixed(1) + '%',
        // sampleUntranslated: untranslated.slice(0, 5),
        sampleMissing: missing.slice(0, 5)
    };
});

function flatten(obj, prefix = '', res = {}) {
    for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            flatten(obj[key], `${prefix}${key}.`, res);
        } else {
            res[`${prefix}${key}`] = obj[key];
        }
    }
    return res;
}

function getMissingKeys(base, target, prefix = '') {
    let missing = [];
    for (const key in base) {
        const currentPath = prefix ? `${prefix}.${key}` : key;
        if (typeof base[key] === 'object' && base[key] !== null) {
            if (!target[key]) {
                missing.push(currentPath + " (entire object)");
            } else {
                missing = missing.concat(getMissingKeys(base[key], target[key], currentPath));
            }
        } else {
            if (target[key] === undefined) {
                missing.push(currentPath);
            }
        }
    }
    return missing;
}

console.log(JSON.stringify(results, null, 2));
