-- =====================================================
-- SUPER ADMIN EKLEME SORGULARI
-- =====================================================

-- NOT: Supabase'de kullanıcı oluşturmanın iki yolu var:
-- 1. Supabase Dashboard > Authentication > Users'dan manuel oluşturma (ÖNERİLEN)
-- 2. Service Role key ile Admin API kullanma (server-side)

-- =====================================================
-- YÖNTEM 1: Eğer kullanıcı zaten Auth'da varsa
-- =====================================================
-- Önce auth.users'da bu email'e sahip kullanıcıyı bulun:
-- SELECT id, email FROM auth.users WHERE email = 'omcell@gmail.com';

-- Eğer kullanıcı varsa, aşağıdaki sorguyu UUID ile çalıştırın:
-- (UUID'yi yukarıdaki SELECT sorgusundan alın)

-- INSERT INTO public.profiles (id, email, full_name, role, is_active)
-- VALUES (
--   '<UUID_BURAYA>',  -- auth.users tablosundaki id
--   'omcell@gmail.com',
--   'Super Admin',
--   'super_admin',
--   true
-- )
-- ON CONFLICT (id) DO UPDATE SET
--   email = EXCLUDED.email,
--   role = 'super_admin',
--   is_active = true,
--   updated_at = timezone('utc'::text, now());

-- =====================================================
-- YÖNTEM 2: Fonksiyon ile kullanıcı oluşturma (Service Role gerekir)
-- =====================================================
-- Bu fonksiyon sadece service_role key ile çalışır
-- SQL Editor'de çalışmaz, server-side kodda kullanılmalı

CREATE OR REPLACE FUNCTION public.create_super_admin(
  p_email text,
  p_password text,
  p_full_name text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Auth kullanıcısı oluştur (auth schema'ya erişim gerekir)
  -- NOT: Bu fonksiyon çalışmaz çünkü auth.users'a direkt INSERT yapamayız
  -- Supabase Admin API kullanılmalı
  
  RAISE EXCEPTION 'Bu fonksiyon çalışmaz. Lütfen Yöntem 3''ü kullanın.';
  
  RETURN v_user_id;
END;
$$;

-- =====================================================
-- YÖNTEM 3: Supabase Dashboard'dan kullanıcı oluşturma (EN KOLAY)
-- =====================================================
-- 1. Supabase Dashboard'a gidin
-- 2. Authentication > Users > Add User
-- 3. Email: omcell@gmail.com
-- 4. Password: (güçlü bir şifre belirleyin)
-- 5. Auto Confirm User: ✅ (işaretleyin)
-- 6. Kullanıcıyı oluşturun
-- 7. Oluşturulan kullanıcının UUID'sini kopyalayın
-- 8. Aşağıdaki sorguyu UUID ile çalıştırın:

-- =====================================================
-- ADIM 1: Kullanıcıyı Auth'da oluşturduktan SONRA bu sorguyu çalıştırın
-- =====================================================

-- Önce kullanıcıyı bulun (UUID'yi almak için):
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'omcell@gmail.com';

-- Eğer kullanıcı yoksa, önce Supabase Dashboard'dan oluşturun!
-- Eğer kullanıcı varsa, yukarıdaki sorgu UUID döndürecek.
-- UUID'yi aşağıdaki INSERT sorgusunda kullanın.

-- =====================================================
-- ADIM 2: Profiles tablosuna ekleyin (UUID ile)
-- =====================================================
-- Aşağıdaki sorguda '<UUID_BURAYA>' yerine yukarıdaki SELECT'ten gelen UUID'yi yazın

-- INSERT INTO public.profiles (id, email, full_name, role, is_active)
-- VALUES (
--   '<UUID_BURAYA>',  -- Yukarıdaki SELECT'ten gelen id
--   'omcell@gmail.com',
--   'Super Admin',
--   'super_admin',
--   true
-- )
-- ON CONFLICT (id) DO UPDATE SET
--   email = EXCLUDED.email,
--   role = 'super_admin',
--   is_active = true,
--   full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
--   updated_at = timezone('utc'::text, now());

-- =====================================================
-- OTOMATIK ÇÖZÜM: Email'e göre bul ve ekle (Eğer kullanıcı zaten varsa)
-- =====================================================
-- Bu sorgu, auth.users'da email'i omcell@gmail.com olan kullanıcıyı bulur
-- ve profiles tablosuna ekler (eğer yoksa)

INSERT INTO public.profiles (id, email, full_name, role, is_active)
SELECT 
  au.id,
  au.email,
  'Super Admin' as full_name,
  'super_admin' as role,
  true as is_active
FROM auth.users au
WHERE au.email = 'omcell@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = au.id
  )
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = 'super_admin',
  is_active = true,
  full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
  updated_at = timezone('utc'::text, now());

-- =====================================================
-- KONTROL: Super admin eklendi mi?
-- =====================================================
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.is_active,
  p.created_at
FROM public.profiles p
WHERE p.email = 'omcell@gmail.com' AND p.role = 'super_admin';
