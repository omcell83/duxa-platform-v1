-- Languages tablosu için SQL Seed Dosyası
-- public/flags klasöründeki tüm bayrak dosyaları için INSERT sorguları
-- Her dil için translations JSONB alanı içinde çoklu dil desteği

INSERT INTO public.languages (code, flag_path, is_active, translations) VALUES
-- Albania / Arnavutça
('al', '/flags/al.svg', true, '{"tr": "Arnavutça", "en": "Albanian", "de": "Albanisch", "me": "Albanski", "ru": "Албанский", "ar": "الألبانية", "al": "Shqip"}'::jsonb),

-- Austria / Avusturya (Almanca)
('at', '/flags/at.svg', true, '{"tr": "Avusturya Almancası", "en": "Austrian German", "de": "Österreichisches Deutsch", "me": "Austrijski nemački", "ru": "Австрийский немецкий", "ar": "الألمانية النمساوية", "at": "Österreichisches Deutsch"}'::jsonb),

-- Bosnia / Boşnakça
('ba', '/flags/ba.svg', true, '{"tr": "Boşnakça", "en": "Bosnian", "de": "Bosnisch", "me": "Bosanski", "ru": "Боснийский", "ar": "البوسنية", "ba": "Bosanski"}'::jsonb),

-- Belgium / Belçika
('be', '/flags/be.svg', true, '{"tr": "Belçika Dili", "en": "Belgian", "de": "Belgisch", "me": "Belgijski", "ru": "Бельгийский", "ar": "البلجيكية", "be": "Belgisch"}'::jsonb),

-- Bulgaria / Bulgarca
('bg', '/flags/bg.svg', true, '{"tr": "Bulgarca", "en": "Bulgarian", "de": "Bulgarisch", "me": "Bugarski", "ru": "Болгарский", "ar": "البلغارية", "bg": "Български"}'::jsonb),

-- Switzerland / İsviçre
('ch', '/flags/ch.svg', true, '{"tr": "İsviçre Dili", "en": "Swiss", "de": "Schweizerdeutsch", "me": "Švajcarski", "ru": "Швейцарский", "ar": "السويسرية", "ch": "Schweizerdeutsch"}'::jsonb),

-- Germany / Almanca
('de', '/flags/de.svg', true, '{"tr": "Almanca", "en": "German", "de": "Deutsch", "me": "Njemački", "ru": "Немецкий", "ar": "الألمانية", "de": "Deutsch"}'::jsonb),

-- Denmark / Danca
('dk', '/flags/dk.svg', true, '{"tr": "Danca", "en": "Danish", "de": "Dänisch", "me": "Danski", "ru": "Датский", "ar": "الدنماركية", "dk": "Dansk"}'::jsonb),

-- Spain / İspanyolca
('es', '/flags/es.svg', true, '{"tr": "İspanyolca", "en": "Spanish", "de": "Spanisch", "me": "Španski", "ru": "Испанский", "ar": "الإسبانية", "es": "Español"}'::jsonb),

-- Finland / Fince
('fi', '/flags/fi.svg', true, '{"tr": "Fince", "en": "Finnish", "de": "Finnisch", "me": "Finski", "ru": "Финский", "ar": "الفنلندية", "fi": "Suomi"}'::jsonb),

-- France / Fransızca
('fr', '/flags/fr.svg', true, '{"tr": "Fransızca", "en": "French", "de": "Französisch", "me": "Francuski", "ru": "Французский", "ar": "الفرنسية", "fr": "Français"}'::jsonb),

-- United Kingdom / İngilizce (UK)
('gb', '/flags/gb.svg', true, '{"tr": "İngilizce (UK)", "en": "English (UK)", "de": "Englisch (UK)", "me": "Engleski (UK)", "ru": "Английский (UK)", "ar": "الإنجليزية (المملكة المتحدة)", "gb": "English (UK)"}'::jsonb),

-- Greece / Yunanca
('gr', '/flags/gr.svg', true, '{"tr": "Yunanca", "en": "Greek", "de": "Griechisch", "me": "Grčki", "ru": "Греческий", "ar": "اليونانية", "gr": "Ελληνικά"}'::jsonb),

-- Croatia / Hırvatça
('hr', '/flags/hr.svg', true, '{"tr": "Hırvatça", "en": "Croatian", "de": "Kroatisch", "me": "Hrvatski", "ru": "Хорватский", "ar": "الكرواتية", "hr": "Hrvatski"}'::jsonb),

-- Italy / İtalyanca
('it', '/flags/it.svg', true, '{"tr": "İtalyanca", "en": "Italian", "de": "Italienisch", "me": "Italijanski", "ru": "Итальянский", "ar": "الإيطالية", "it": "Italiano"}'::jsonb),

-- Luxembourg / Lüksemburgca
('lu', '/flags/lu.svg', true, '{"tr": "Lüksemburgca", "en": "Luxembourgish", "de": "Luxemburgisch", "me": "Luksemburški", "ru": "Люксембургский", "ar": "اللوكسمبورغية", "lu": "Lëtzebuergesch"}'::jsonb),

-- Montenegro / Karadağca
('me', '/flags/me.svg', true, '{"tr": "Karadağca", "en": "Montenegrin", "de": "Montenegrinisch", "me": "Crnogorski", "ru": "Черногорский", "ar": "الجبل الأسود", "me": "Crnogorski"}'::jsonb),

-- Netherlands / Hollandaca
('nl', '/flags/nl.svg', true, '{"tr": "Hollandaca", "en": "Dutch", "de": "Niederländisch", "me": "Holandski", "ru": "Голландский", "ar": "الهولندية", "nl": "Nederlands"}'::jsonb),

-- Norway / Norveççe
('no', '/flags/no.svg', true, '{"tr": "Norveççe", "en": "Norwegian", "de": "Norwegisch", "me": "Norveški", "ru": "Норвежский", "ar": "النرويجية", "no": "Norsk"}'::jsonb),

-- Poland / Lehçe
('pl', '/flags/pl.svg', true, '{"tr": "Lehçe", "en": "Polish", "de": "Polnisch", "me": "Poljski", "ru": "Польский", "ar": "البولندية", "pl": "Polski"}'::jsonb),

-- Portugal / Portekizce
('pt', '/flags/pt.svg', true, '{"tr": "Portekizce", "en": "Portuguese", "de": "Portugiesisch", "me": "Portugalski", "ru": "Португальский", "ar": "البرتغالية", "pt": "Português"}'::jsonb),

-- Romania / Romence
('ro', '/flags/ro.svg', true, '{"tr": "Romence", "en": "Romanian", "de": "Rumänisch", "me": "Rumunski", "ru": "Румынский", "ar": "الرومانية", "ro": "Română"}'::jsonb),

-- Serbia / Sırpça
('rs', '/flags/rs.svg', true, '{"tr": "Sırpça", "en": "Serbian", "de": "Serbisch", "me": "Srpski", "ru": "Сербский", "ar": "الصربية", "rs": "Српски"}'::jsonb),

-- Russia / Rusça
('ru', '/flags/ru.svg', true, '{"tr": "Rusça", "en": "Russian", "de": "Russisch", "me": "Ruski", "ru": "Русский", "ar": "الروسية", "ru": "Русский"}'::jsonb),

-- Sweden / İsveççe
('se', '/flags/se.svg', true, '{"tr": "İsveççe", "en": "Swedish", "de": "Schwedisch", "me": "Švedski", "ru": "Шведский", "ar": "السويدية", "se": "Svenska"}'::jsonb),

-- Turkey / Türkçe
('tr', '/flags/tr.svg', true, '{"tr": "Türkçe", "en": "Turkish", "de": "Türkisch", "me": "Turski", "ru": "Турецкий", "ar": "التركية", "tr": "Türkçe"}'::jsonb),

-- United States / İngilizce (US)
('us', '/flags/us.svg', true, '{"tr": "İngilizce (US)", "en": "English (US)", "de": "Englisch (US)", "me": "Engleski (US)", "ru": "Английский (US)", "ar": "الإنجليزية (الولايات المتحدة)", "us": "English (US)"}'::jsonb)
ON CONFLICT (code) DO UPDATE SET
  flag_path = EXCLUDED.flag_path,
  translations = EXCLUDED.translations,
  is_active = EXCLUDED.is_active;

-- Not: Bu sorgu PostgreSQL/Supabase için hazırlanmıştır.
-- Eğer languages tablosunda code sütunu UNIQUE constraint'i yoksa, ON CONFLICT kısmını kaldırın.
-- Her bir bayrak için translations JSONB içinde ana dillerin çevirileri mevcuttur:
-- tr (Türkçe), en (İngilizce), de (Almanca), me (Karadağca), ru (Rusça), ar (Arapça), ve kendi dil kodu
