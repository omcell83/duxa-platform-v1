-- TENANT_USERS RLS FIX - Service Role Full Access
-- Bu SQL kodu tenant_users tablosu için Service Role'e tam yetki verir
-- RLS politikalarını bypass eder ve admin işlemlerinin sorunsuz çalışmasını sağlar
-- 
-- KULLANIM: Bu SQL kodunu Supabase SQL Editor'de çalıştırın

-- Mevcut politikaları kontrol et (opsiyonel)
-- SELECT * FROM pg_policies WHERE tablename = 'tenant_users';

-- Service Role için tam yetki politikası oluştur
CREATE POLICY IF NOT EXISTS "Service Role Full Access" 
ON "public"."tenant_users"
AS PERMISSIVE FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Not: Bu politika service_role kullanıcısının (SUPABASE_SERVICE_ROLE_KEY ile bağlanan)
-- tenant_users tablosunda tüm işlemleri (SELECT, INSERT, UPDATE, DELETE) yapmasına izin verir.
-- Bu sayede createTenant işlemi sırasında RLS engeline takılmaz.
