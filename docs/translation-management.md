# Translation Management System

## Overview
AI-powered translation management system for the Duxa platform. Supports 8 languages with automatic translation using LibreTranslate (free and open-source).

## Supported Languages

| Language Code | Country | Language Name |
|--------------|---------|---------------|
| `en` | 🇬🇧 GB | İngilizce (English) |
| `de` | 🇩🇪 DE | Almanca (German) |
| `fr` | 🇫🇷 FR | Fransızca (French) |
| `lb` | 🇱🇺 LU | Lüksemburgca (Luxembourgish) |
| `tr` | 🇹🇷 TR | Türkçe (Turkish) |
| `me` | 🇲🇪 ME | Karadağca (Montenegrin) |
| `mt` | 🇲🇹 MT | Maltaca (Maltese) |
| `ru` | 🇷🇺 RU | Rusça (Russian) |

## Features

### 1. **AI-Powered Translation**
- Uses LibreTranslate API (free and open-source)
- Automatic translation from English (source) to target languages
- Batched processing for optimal performance
- Rate limiting protection (50 items per batch, 1s delay)

### 2. **Translation Editor**
- View source (English) and target translations side-by-side
- Edit translations manually
- Search functionality to find specific keys
- Track edited translations with badges
- Real-time preview

### 3. **File Management**
- Download individual language files (`de.json`, `tr.json`, etc.)
- Bulk download all languages
- Maintains original JSON structure
- Proper formatting (2-space indentation)

## Usage

### Accessing the Translation Manager
1. Navigate to: `https://duxa.pro/super-admin/settings`
2. Click on **"Çeviri Yönetimi"** (Translation Management)

### Translating to a New Language
1. Select target language from dropdown
2. Click **"AI ile Çevir"** (Translate with AI)
3. Wait for translation to complete (progress shown in console)
4. Review and edit translations as needed
5. Click **"İndir"** (Download) to save the JSON file

### Editing Translations
1. Use the search bar to find specific keys
2. Edit the translation in the textarea
3. Changes are tracked with "Düzenlendi" badge
4. Download the updated file when ready

### Installing Translation Files
1. Download the translated JSON file
2. Place it in the `i18n/` directory
3. File naming convention: `{language_code}.json`
   - Example: `de.json`, `tr.json`, `fr.json`

## Technical Details

### API Endpoint
- **URL**: `/api/translate`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "sourceData": { /* en.json content */ },
    "targetLanguage": "de"
  }
  ```
- **Response**: Translated JSON object

### Translation Service
- **Provider**: LibreTranslate
- **Public Instance**: `https://libretranslate.com`
- **Cost**: Free (open-source)
- **Rate Limits**: Handled with batching and delays

### Language Mapping
Some languages are mapped to closest alternatives:
- Luxembourgish (`lb`) → German (`de`)
- Montenegrin (`me`) → Serbian (`sr`)
- Maltese (`mt`) → English (`en`) fallback

### Performance Optimization
- **Batch Size**: 50 translations per batch
- **Delay**: 1 second between batches
- **Concurrent Processing**: Parallel translation within batches
- **Progress Logging**: Console logs show translation progress

## File Structure

```
app/
├── super-admin/
│   └── settings/
│       └── translations/
│           └── page.tsx          # Main translation page
├── api/
│   └── translate/
│       └── route.ts              # Translation API endpoint
components/
└── super-admin/
    └── translation-editor.tsx    # Translation editor component
i18n/
├── en.json                       # Source file (English)
├── de.json                       # German translations
├── fr.json                       # French translations
├── tr.json                       # Turkish translations
└── ...                           # Other language files
```

## Best Practices

### 1. **Always Review AI Translations**
- AI translations may not be perfect
- Review context-specific terms (restaurant, menu items)
- Check for cultural appropriateness

### 2. **Maintain Consistency**
- Use the same terminology across all languages
- Keep placeholders intact (e.g., `{count}`, `{name}`)
- Preserve HTML tags and special characters

### 3. **Test Translations**
- Load translated files in the application
- Check UI for text overflow
- Verify special characters display correctly

### 4. **Version Control**
- Commit translation files to Git
- Document major translation updates
- Track changes with meaningful commit messages

## Troubleshooting

### Translation Fails
- **Issue**: API returns error
- **Solution**: Check internet connection, try again later (rate limits)

### Missing Translations
- **Issue**: Some keys not translated
- **Solution**: Edit manually in the editor

### File Download Issues
- **Issue**: Downloaded file is empty
- **Solution**: Ensure translation is complete before downloading

### Special Characters
- **Issue**: Characters display incorrectly
- **Solution**: Ensure file is saved as UTF-8

## Future Enhancements

- [ ] Translation memory/cache
- [ ] Multiple translation providers
- [ ] Automatic translation on file upload
- [ ] Translation quality scoring
- [ ] Collaborative translation workflow
- [ ] Translation history/versioning
- [ ] Glossary management for consistent terminology

## Support

For issues or questions:
1. Check console logs for errors
2. Verify LibreTranslate API status
3. Contact system administrator

---

**Last Updated**: January 2026
**Version**: 1.0.0
