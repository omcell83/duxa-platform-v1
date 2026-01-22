const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../i18n/en.json');
const outputPath = path.join(__dirname, '../missing_content.json');

const missingKeys = [
    'marketing',
    'templates',
    'orderingPage',
    'aiContentPage',
    'waitlist',
    'pricing',
    'analytics',
    'slugPolicy',
    'slugValidation',
    'admin',
    'businessProfile',
    'support',
    'partner',
    'billing',
    'staffMenu',
    'extraction',
    'cookieConsent',
    'resources',
    'ordering',
    'importLanding',
    'importProcessing',
    'claimMenu',
    'claimProcessing',
    'partnerApplication'
];

try {
    const enContent = fs.readFileSync(enPath, 'utf8');
    const enJson = JSON.parse(enContent);
    const extracted = {};

    missingKeys.forEach(key => {
        if (enJson[key]) {
            extracted[key] = enJson[key];
        } else {
            console.warn(`Warning: Key '${key}' not found in en.json`);
        }
    });

    fs.writeFileSync(outputPath, JSON.stringify(extracted, null, 2), 'utf8');
    console.log(`Successfully extracted missing keys to ${outputPath}`);
} catch (error) {
    console.error('Error extracting keys:', error);
    process.exit(1);
}
