-- Supabase RLS Politikaları: newsletter_subscribers tablosu için KESIN ÇÖZÜM
-- Tüm eski politikaları temizle ve doğru politikaları ekle

-- 1. Mevcut TÜM politikaları sil
DROP POLICY IF EXISTS "Herkes abone olabilir" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Sadece adminler görebilir" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Allow public insert on newsletter_subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Allow public update on newsletter_subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Allow public update on newsletter_subscribers for email conflict" ON public.newsletter_subscribers;

-- 2. INSERT Politikası (Yeni kayıtlar için - UPSERT'in INSERT kısmı)
CREATE POLICY "public_insert_newsletter"
ON public.newsletter_subscribers
FOR INSERT
TO public
WITH CHECK (true);

-- 3. UPDATE Politikası (Email çakışması durumunda - UPSERT'in UPDATE kısmı)
CREATE POLICY "public_update_newsletter"
ON public.newsletter_subscribers
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- 4. SELECT Politikası (upsert().select() için gerekli - public için de açık olmalı)
CREATE POLICY "public_select_newsletter"
ON public.newsletter_subscribers
FOR SELECT
TO public
USING (true);

-- 5. Kontrol: Politikaların doğru oluşturulduğunu kontrol et
-- SELECT * FROM pg_policies WHERE tablename = 'newsletter_subscribers';
-- 3 politika görmelisiniz: public_insert_newsletter, public_update_newsletter, public_select_newsletter

-- NOT: UPSERT işlemi için 3 politika gerekir:
-- 1. INSERT: Yeni kayıt eklemek için
-- 2. UPDATE: Çakışma durumunda güncelleme yapmak için  
-- 3. SELECT: .select() ile sonucu döndürmek için (upsert().select() kullanıyoruz)
