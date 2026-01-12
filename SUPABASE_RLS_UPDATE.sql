-- Supabase RLS Policy: newsletter_subscribers tablosu için UPDATE izni
-- Anonim kullanıcıların (public) email sütunu çakışırsa güncelleme yapabilmesi için

-- Mevcut INSERT politikasını kontrol et (varsa):
-- SELECT * FROM pg_policies WHERE tablename = 'newsletter_subscribers';

-- UPDATE Politikası: Email çakışması durumunda is_active'i true yap
CREATE POLICY "Allow public update on newsletter_subscribers for email conflict"
ON public.newsletter_subscribers
FOR UPDATE
TO public
USING (true)  -- Herkese izin ver (anonim kullanıcılar dahil)
WITH CHECK (true);  -- Güncelleme kontrolü (email unique constraint zaten var)

-- Alternatif: Daha kısıtlayıcı politika (sadece is_active güncellemesi için)
-- CREATE POLICY "Allow public update is_active on newsletter_subscribers"
-- ON public.newsletter_subscribers
-- FOR UPDATE
-- TO public
-- USING (true)
-- WITH CHECK (
--   -- Sadece is_active sütunu değiştirilebilir (email değiştirilemez)
--   -- Bu daha güvenli ama upsert için yeterli olmayabilir
--   true
-- );

-- Not: UPSERT işlemi (INSERT ... ON CONFLICT UPDATE) için hem INSERT hem UPDATE politikası gerekir.
-- INSERT politikası muhtemelen zaten var, bu UPDATE politikasını ekliyoruz.
