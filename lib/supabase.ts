import { createClient } from '@supabase/supabase-js';

// Değerleri doğrudan koddan DEĞİL, Coolify'ın enjekte ettiği ortamdan okuyoruz.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Eğer Coolify'da bu ayarlar yapılmamışsa sistemi durdurup hata veriyoruz (Loglarda görünür)
if (!supabaseUrl || !supabaseKey) {
  throw new Error("GÜVENLİK UYARISI: Supabase ortam değişkenleri Coolify panelinde bulunamadı.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);