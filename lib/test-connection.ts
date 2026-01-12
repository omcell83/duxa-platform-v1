/**
 * Supabase Bağlantı Testi (Diagnostic Tool)
 * 
 * Bu dosya Supabase bağlantısını test eder ve sorunları tespit eder.
 * Çalıştırmak için: npx tsx lib/test-connection.ts
 * 
 * NOT: Ortam değişkenleri .env.local veya .env dosyasından okunur.
 * Coolify'da production'da bu değişkenler otomatik olarak enjekte edilir.
 */

// Ortam değişkenlerini yükle (.env dosyasından)
import { config } from 'dotenv';
import { resolve } from 'path';

// .env.local varsa onu kullan, yoksa .env'yi dene
const envPath = resolve(process.cwd(), '.env.local');
const envPathFallback = resolve(process.cwd(), '.env');
config({ path: envPath });
config({ path: envPathFallback });

import { createClient } from '@supabase/supabase-js';

// Ortam Değişkenlerini Kontrol Et
console.log('\n=== ORTAM DEĞİŞKENLERİ KONTROLÜ ===');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Var' : 'Yok');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? 'Var' : 'Yok');

if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ HATA: Supabase ortam değişkenleri eksik!');
  console.error('Lütfen Coolify panelinde şu değişkenlerin tanımlı olduğundan emin olun:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Supabase Client Oluştur
console.log('\n=== SUPABASE CLIENT OLUŞTURULUYOR ===');
const supabase = createClient(supabaseUrl, supabaseKey);
console.log('✓ Client oluşturuldu');

// Bağlantı Testi: newsletter_subscribers Tablosundan Veri Çekme
console.log('\n=== BAĞLANTI TESTİ: newsletter_subscribers TABLOSU ===');

async function testConnection() {
  try {
    // Basit bir count sorgusu - en hafif test
    console.log('Tablo sayısı alınıyor...');
    const { count, error: countError } = await supabase
      .from('newsletter_subscribers')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('\n❌ BAĞLANTI BAŞARISIZ - COUNT SORGUSU HATASI');
      console.error('Hata Mesajı:', countError.message);
      console.error('Hata Kodu:', countError.code || 'N/A');
      console.error('Hata Detayı:', countError.details || 'N/A');
      console.error('Hata Hint:', countError.hint || 'N/A');
      process.exit(1);
    }

    console.log(`✓ Tablo sayısı alındı: ${count} kayıt`);

    // İlk kaydı çekmeyi dene (eğer varsa)
    console.log('\nİlk kayıt alınıyor (test için)...');
    const { data, error: selectError } = await supabase
      .from('newsletter_subscribers')
      .select('id, email, is_active, created_at')
      .limit(1);

    if (selectError) {
      console.error('\n❌ BAĞLANTI BAŞARISIZ - SELECT SORGUSU HATASI');
      console.error('Hata Mesajı:', selectError.message);
      console.error('Hata Kodu:', selectError.code || 'N/A');
      console.error('Hata Detayı:', selectError.details || 'N/A');
      console.error('Hata Hint:', selectError.hint || 'N/A');
      process.exit(1);
    }

    console.log('✓ SELECT sorgusu başarılı');
    if (data && data.length > 0) {
      console.log('Örnek kayıt:', JSON.stringify(data[0], null, 2));
    } else {
      console.log('Tablo boş (bu normal, eğer henüz kayıt yoksa)');
    }

    // Başarılı!
    console.log('\n✅ BAĞLANTI BAŞARILI');
    console.log('Supabase bağlantısı çalışıyor ve newsletter_subscribers tablosuna erişim başarılı.');
    process.exit(0);

  } catch (error: any) {
    console.error('\n❌ BAĞLANTI BAŞARISIZ - BEKLENMEYEN HATA');
    console.error('Hata Tipi:', error.constructor.name);
    console.error('Hata Mesajı:', error.message);
    
    if (error.code) {
      console.error('Hata Kodu:', error.code);
    }
    if (error.details) {
      console.error('Hata Detayı:', error.details);
    }
    if (error.hint) {
      console.error('Hata Hint:', error.hint);
    }
    
    console.error('\nTam Hata:', error);
    process.exit(1);
  }
}

// Testi Çalıştır
testConnection();
