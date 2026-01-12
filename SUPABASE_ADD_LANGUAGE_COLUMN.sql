-- Supabase: newsletter_subscribers tablosuna language sütunu ekle
-- Bu sütun müşterinin tercih ettiği dili saklar (tr, en, de, vb.)

ALTER TABLE public.newsletter_subscribers 
ADD COLUMN IF NOT EXISTS language text DEFAULT 'en';

-- Mevcut kayıtlar için varsayılan dil İngilizce olarak ayarlanır
-- Yeni kayıtlar formdan gönderilen dil ile kaydedilir
