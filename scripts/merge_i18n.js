const fs = require('fs');
const path = require('path');

const targetFile = process.argv[2];
const patchFile = process.argv[3];

if (!targetFile || !patchFile) {
    console.error('Usage: node merge_i18n.js <targetFile> <patchFile>');
    process.exit(1);
}

try {
    let targetData = {};
    if (fs.existsSync(targetFile)) {
        try {
            targetData = JSON.parse(fs.readFileSync(targetFile, 'utf8'));
        } catch (e) {
            console.warn('Target file exists but is invalid JSON. Overwriting.');
        }
    }

    const patchData = JSON.parse(fs.readFileSync(patchFile, 'utf8'));

    // Shallow merge is sufficient as we are splitting by top-level keys
    const mergedData = { ...targetData, ...patchData };

    fs.writeFileSync(targetFile, JSON.stringify(mergedData, null, 2), 'utf8');
    console.log(`Successfully merged ${patchFile} into ${targetFile}`);
} catch (error) {
    console.error('Error merging files:', error);
    process.exit(1);
}
