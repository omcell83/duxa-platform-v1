-- Supabase RLS Politikaları: newsletter_subscribers tablosu için TAM ÇÖZÜM
-- UPSERT işlemi için hem INSERT hem UPDATE politikası gerekir!

-- Önce mevcut politikaları kontrol et:
-- SELECT * FROM pg_policies WHERE tablename = 'newsletter_subscribers';

-- 1. RLS'yi etkinleştir (eğer yoksa)
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- 2. Mevcut politikaları sil (eğer varsa ve sorunluysa)
DROP POLICY IF EXISTS "Allow public insert on newsletter_subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Allow public update on newsletter_subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Allow public update on newsletter_subscribers for email conflict" ON public.newsletter_subscribers;

-- 3. INSERT Politikası (Yeni kayıtlar için)
CREATE POLICY "Allow public insert on newsletter_subscribers"
ON public.newsletter_subscribers
FOR INSERT
TO public
WITH CHECK (true);

-- 4. UPDATE Politikası (Email çakışması durumunda güncelleme için)
CREATE POLICY "Allow public update on newsletter_subscribers"
ON public.newsletter_subscribers
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- 5. Kontrol: Politikaların doğru oluşturulduğunu kontrol et
-- SELECT * FROM pg_policies WHERE tablename = 'newsletter_subscribers';

-- NOT: UPSERT işlemi (INSERT ... ON CONFLICT UPDATE) için:
-- - INSERT politikası: Yeni kayıt eklemek için gerekli
-- - UPDATE politikası: Çakışma durumunda güncelleme yapmak için gerekli
-- Her ikisi de public (anonim kullanıcılar) için açık olmalı!
