# Super Admin Modülü - Veritabanı Genişletme

Bu dokümantasyon, Duxa v1 projesi için Supabase veritabanına eklenen yeni tabloları ve güvenlik politikalarını açıklar.

## 📋 Oluşturulan Dosyalar

1. **SUPABASE_SUPER_ADMIN_MODULE.sql** - Tüm SQL sorguları ve RLS politikaları
2. **lib/types.ts** - TypeScript interface tanımlamaları (güncellendi)

## 🗄️ Yeni Tablolar

### 1. `profiles` (Admin Users / Personel)
- Supabase `auth.users` ile ilişkili profil tablosu
- Roller: `super_admin`, `support`, `sales`, `user`
- Personel bilgileri (ad, telefon, departman, pozisyon)

### 2. `tenants` (Genişletilmiş)
- Mevcut tablo genişletildi (ALTER TABLE)
- Yeni alanlar:
  - Ticari Unvan, Marka Adı, Vergi No
  - İletişim bilgileri (email, telefon, adres)
  - Online/Offline durumu
  - Sözleşme tarihi, ödeme periyodu, son ödeme durumu

### 3. `subscriptions` (Abonelikler ve Ödemeler)
- Tenant'a bağlı abonelik ve ödeme kayıtları
- Her ödeme için yeni satır (filtreleme ile görüntülenebilir)
- Sözleşme detayları, fiyat, indirim oranı
- Donanım listesi (JSON formatında)
- Ödeme durumu, tarihi, şekli

### 4. `hardware_inventory` (Donanım Envanteri)
- Cihaz seri numaraları
- Cihaz tipi: `kiosk`, `pos`
- Durumlar: `in_stock`, `rented`, `under_repair`, `broken`, `decommissioned`
- Tenant'a zimmet bilgisi
- Depo giriş/çıkış tarihleri

### 5. `system_translations` (Sistem Çevirileri)
- Çok dilli sistem için çeviri anahtarları
- Key-LangCode kombinasyonu unique
- Key-value çiftleri

### 6. `mail_configs` (Email Ayarları)
- SMTP ayarları
- Email şablonları
- HTML ve text içerikleri

## 🔒 Güvenlik (RLS Policies)

### Genel Prensipler:
- ✅ **RLS (Row Level Security)** tüm tablolarda aktif
- ✅ **INSERT/UPDATE/DELETE**: Sadece `role = 'super_admin'` olan kullanıcılar
- ✅ **SELECT**: Tabloya göre değişken (detaylar aşağıda)

### Detaylı Politika Özeti:

| Tablo | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `profiles` | Kendi profil + Super Admin (hepsi) | Super Admin | Kendi profil (role değiştiremez) + Super Admin | Super Admin |
| `tenants` | Authenticated (hepsi) | Super Admin | Super Admin | Super Admin |
| `subscriptions` | Authenticated (hepsi) | Super Admin | Super Admin | Super Admin |
| `hardware_inventory` | Authenticated (hepsi) | Super Admin | Super Admin | Super Admin |
| `system_translations` | Public (hepsi) | Super Admin | Super Admin | Super Admin |
| `mail_configs` | Super Admin | Super Admin | Super Admin | Super Admin |

**Not**: SELECT politikaları geniş tutulmuştur. Tenant isolation (kiracı izolasyonu) uygulama katmanında (application layer) `tenant_id` filtresi ile sağlanmalıdır.

## 🚀 Kurulum Adımları

### 1. SQL Dosyasını Çalıştırın
1. Supabase Dashboard'a giriş yapın
2. SQL Editor'ü açın
3. `SUPABASE_SUPER_ADMIN_MODULE.sql` dosyasının içeriğini kopyalayın
4. SQL Editor'de çalıştırın

### 2. İlk Super Admin Kullanıcısını Oluşturun

**Önemli**: SQL dosyasını çalıştırdıktan sonra, ilk super admin kullanıcısını oluşturmanız gerekiyor:

```sql
-- 1. Önce auth.users'da bir kullanıcı oluşturun (Supabase Auth ile)
-- 2. Sonra profiles tablosuna kayıt ekleyin:

INSERT INTO public.profiles (id, email, full_name, role) 
VALUES (
  '<auth_user_uuid>',  -- Supabase Auth'da oluşturulan kullanıcının UUID'si
  'admin@example.com', 
  'Super Admin', 
  'super_admin'
);
```

**Alternatif**: Supabase Dashboard > Authentication > Users bölümünden kullanıcı oluşturun, UUID'sini kopyalayın ve yukarıdaki INSERT sorgusunu çalıştırın.

### 3. TypeScript Tiplerini Kullanın

Artık `lib/types.ts` dosyasındaki interface'leri kullanabilirsiniz:

```typescript
import { Profile, Tenant, Subscription, HardwareInventory } from '@/lib/types';

// Örnek kullanım
const profile: Profile = {
  id: 'uuid',
  email: 'admin@example.com',
  role: 'super_admin',
  // ...
};
```

## ⚠️ Önemli Notlar

1. **Mevcut Tablolar Korundu**: `tenants`, `products`, `categories` tablolarına dokunulmadı, sadece `tenants` tablosu genişletildi.

2. **Tenant Isolation**: SELECT politikaları geniş tutulmuştur. Uygulama kodunuzda mutlaka `tenant_id` filtresi kullanın:
   ```typescript
   const { data } = await supabase
     .from('subscriptions')
     .select('*')
     .eq('tenant_id', currentTenantId); // ÖNEMLİ!
   ```

3. **SMTP Şifreleri**: `mail_configs` tablosundaki `smtp_password` alanı düz metin olarak saklanır. Production'da encryption kullanmanız önerilir (application layer'da).

4. **Hardware List**: `subscriptions` tablosundaki `hardware_list` alanı JSONB formatındadır. Örnek:
   ```json
   [
     { "serial_number": "KIO-001", "type": "kiosk", "price": 5000 },
     { "serial_number": "POS-001", "type": "pos", "price": 2000 }
   ]
   ```

5. **Updated_at Triggers**: Tüm tablolarda `updated_at` alanı otomatik olarak güncellenir (trigger ile).

6. **Mevcut Status Alanı**: `tenants` tablosunda zaten `status` alanı varsa ve farklı değerler içeriyorsa, CHECK constraint eklenmeyebilir. Bu durumda ALTER TABLE komutunu manuel olarak düzenleyin.

## 🔍 Kontrol Sorguları

### RLS Politikalarını Kontrol Etme:
```sql
SELECT * FROM pg_policies WHERE tablename = 'profiles';
SELECT * FROM pg_policies WHERE tablename = 'tenants';
-- vs.
```

### Super Admin Kullanıcılarını Listeleme:
```sql
SELECT * FROM public.profiles WHERE role = 'super_admin' AND is_active = true;
```

### Tablo Yapılarını Kontrol Etme:
```sql
\d public.profiles
\d public.tenants
\d public.subscriptions
-- vs.
```

## 📝 Sonraki Adımlar

1. ✅ SQL dosyasını Supabase'de çalıştırın
2. ✅ İlk super admin kullanıcısını oluşturun
3. ✅ TypeScript tiplerini test edin
4. ✅ Super Admin UI'ını bu yeni tablolarla entegre edin
5. ✅ Tenant isolation'ı uygulama katmanında uygulayın

## 🆘 Sorun Giderme

**Sorun**: "function is_super_admin does not exist" hatası
**Çözüm**: SQL dosyasını baştan sona tekrar çalıştırın. Fonksiyonlar ve trigger'lar doğru sırayla oluşturulmalı.

**Sorun**: RLS politikaları çalışmıyor
**Çözüm**: 
1. RLS'nin aktif olduğunu kontrol edin: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`
2. Kullanıcının `super_admin` rolüne sahip olduğunu kontrol edin
3. `is_super_admin()` fonksiyonunun çalıştığını test edin: `SELECT public.is_super_admin('<user_uuid>');`

**Sorun**: ALTER TABLE hataları
**Çözüm**: Mevcut `tenants` tablosundaki alanların adlarını kontrol edin. Zaten var olan alanlar için `ADD COLUMN IF NOT EXISTS` kullanıldı, ancak CHECK constraint'ler mevcut verilerle uyumsuz olabilir.
