# Yeni Dil Ekleme Rehberi

Bu rehber, projenize yeni bir dil desteği eklemek istediğinizde `scripts/translate_manager.js` dosyasında yapmanız gereken değişiklikleri adım adım açıklar.

## 1. Hazırlık
- Proje kök dizininde `.env` dosyanızın olduğundan ve içinde geçerli bir `OPENAI_API_KEY` bulunduğundan emin olun.
- Kaynak dosyanızın (`i18n/en.json`) güncel olduğundan emin olun.

## 2. Script Dosyasını Düzenleme

1.  `scripts/translate_manager.js` dosyasını açın.
2.  Dosyanın üst kısımlarında `TARGET_LANGUAGES` isimli diziyi (array) bulun. Bu dizi şuna benzer görünecektir:

```javascript
const TARGET_LANGUAGES = [
  { code: 'fr', name: 'French' },
  { code: 'lb', name: 'Luxembourgish' },
  { code: 'tr', name: 'Turkish' },
  // ... diğer diller
];
```

3.  Bu listeye yeni eklemek istediğiniz dili, aşağıdaki formatta ekleyin:
    - **code**: Dilin ISO kodu (dosya adı bu kodla oluşturulacak, örn: `es.json`, `it.json`).
    - **name**: Dilin İngilizce adı (Yapay zekanın doğru çeviri yapması için gereklidir).

    **Örnek:** İspanyolca ve İtalyanca eklemek isterseniz:

```javascript
const TARGET_LANGUAGES = [
  // Mevcut diller...
  { code: 'fr', name: 'French' },
  
  // YENİ EKLENENLER:
  { code: 'es', name: 'Spanish' },
  { code: 'it', name: 'Italian' },
];
```

## 3. Scripti Çalıştırma

Terminali açın ve proje kök dizininde şu komutu çalıştırın:

```bash
node scripts/translate_manager.js
```

## 4. Sonuçları Kontrol Etme

Script çalışmayı bitirdiğinde:
1.  `i18n/` klasörünü kontrol edin.
2.  Yeni eklediğiniz dil koduna sahip dosyanın (örn: `es.json`) oluşturulduğunu doğrulayın.
3.  İçeriğini açıp rastgele birkaç anahtarın doğru çevrildiğini kontrol edin.

## İpuçları
- **Sadece Yeni Dili Çevirmek İçin:** Eğer *sadece* yeni eklediğiniz dili çevirmek istiyorsanız, `TARGET_LANGUAGES` dizisindeki diğer dilleri geçici olarak yorum satırına alabilirsiniz. Bu sayede hem zamandan tasarruf edersiniz hem de mevcut dosyaların üzerine yazılmasını engellemiş olursunuz.

```javascript
const TARGET_LANGUAGES = [
  // { code: 'fr', name: 'French' }, // Yorum satırına alındı
  // { code: 'tr', name: 'Turkish' }, // Yorum satırına alındı
  { code: 'es', name: 'Spanish' },   // Sadece bu çevrilecek
];
```


- **Maliyet ve Hız:** Dosya boyutu büyük olduğu için çeviri işlemi birkaç dakika sürebilir. Script, API limitlerine takılmamak için işlemi parçalar (chunk) halinde yapar.
