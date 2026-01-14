-- =====================================================
-- SUPER ADMIN EKLEME - omcell@gmail.com
-- =====================================================
-- Bu sorgu, auth.users'da omcell@gmail.com kullanıcısını bulur
-- ve profiles tablosuna super_admin olarak ekler

-- ADIM 1: Önce kullanıcının auth.users'da olup olmadığını kontrol edin
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'omcell@gmail.com';

-- Eğer yukarıdaki sorgu sonuç döndürmezse, önce kullanıcıyı oluşturmanız gerekir:
-- Supabase Dashboard > Authentication > Users > Add User
-- Email: omcell@gmail.com
-- Password: (güçlü bir şifre)
-- Auto Confirm User: ✅

-- =====================================================
-- ADIM 2: Profiles tablosuna ekleyin
-- =====================================================
-- Bu sorgu, auth.users'da varsa otomatik olarak profiles'a ekler

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
-- KONTROL: Super admin başarıyla eklendi mi?
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
