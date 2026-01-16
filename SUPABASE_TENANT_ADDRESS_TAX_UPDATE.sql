-- A. VERİTABANI GÜNCELLEMELERİ

-- 1. languages Tablosu Revizyonu: tax_identifier_label sütunu ekle
ALTER TABLE public.languages 
ADD COLUMN IF NOT EXISTS tax_identifier_label TEXT;

-- 2. Mevcut verileri güncelle
UPDATE public.languages SET tax_identifier_label = 'VKN / TCKN' WHERE code = 'tr';
UPDATE public.languages SET tax_identifier_label = 'PIB / PDV' WHERE code = 'me';
UPDATE public.languages SET tax_identifier_label = 'Steuernummer' WHERE code = 'de';
UPDATE public.languages SET tax_identifier_label = 'EIN' WHERE code = 'us';
UPDATE public.languages SET tax_identifier_label = 'VAT Number' WHERE code = 'gb';
UPDATE public.languages SET tax_identifier_label = 'NIF' WHERE code = 'es';
UPDATE public.languages SET tax_identifier_label = 'SIRET' WHERE code = 'fr';
UPDATE public.languages SET tax_identifier_label = 'Partita IVA' WHERE code = 'it';
UPDATE public.languages SET tax_identifier_label = 'CIF' WHERE code = 'ro';
UPDATE public.languages SET tax_identifier_label = 'VAT Number' WHERE code = 'nl';
UPDATE public.languages SET tax_identifier_label = 'VAT Number' WHERE code = 'be';
UPDATE public.languages SET tax_identifier_label = 'VAT Number' WHERE code = 'at';
UPDATE public.languages SET tax_identifier_label = 'VAT Number' WHERE code = 'ch';
UPDATE public.languages SET tax_identifier_label = 'VAT Number' WHERE code = 'pl';
UPDATE public.languages SET tax_identifier_label = 'VAT Number' WHERE code = 'pt';
UPDATE public.languages SET tax_identifier_label = 'VAT Number' WHERE code = 'se';
UPDATE public.languages SET tax_identifier_label = 'VAT Number' WHERE code = 'no';
UPDATE public.languages SET tax_identifier_label = 'VAT Number' WHERE code = 'dk';
UPDATE public.languages SET tax_identifier_label = 'VAT Number' WHERE code = 'fi';
UPDATE public.languages SET tax_identifier_label = 'ИНН' WHERE code = 'ru';
UPDATE public.languages SET tax_identifier_label = 'ΑΦΜ' WHERE code = 'gr';
UPDATE public.languages SET tax_identifier_label = 'OIB' WHERE code = 'hr';
UPDATE public.languages SET tax_identifier_label = 'PIB' WHERE code = 'rs';
UPDATE public.languages SET tax_identifier_label = 'PIB' WHERE code = 'ba';
UPDATE public.languages SET tax_identifier_label = 'NIPT' WHERE code = 'al';
UPDATE public.languages SET tax_identifier_label = 'VAT Number' WHERE code = 'lu';
UPDATE public.languages SET tax_identifier_label = 'VAT Number' WHERE code = 'ie';
UPDATE public.languages SET tax_identifier_label = 'VAT Number' WHERE code = 'bg';

-- 3. tenants Tablosu Revizyonu: address ve country_code sütunları ekle
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS country_code TEXT,
ADD COLUMN IF NOT EXISTS legal_name TEXT,
ADD COLUMN IF NOT EXISTS tax_id TEXT,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'TRY';

-- Not: Mevcut tenants için country_code varsayılan değer olarak 'tr' atanabilir (opsiyonel)
-- UPDATE public.tenants SET country_code = 'tr' WHERE country_code IS NULL;
