import imageCompression from 'browser-image-compression';
import { createClient } from '@/lib/supabase-browser';

const MAX_IMAGES = 6;
const MAX_SIZE_MB = 1;
const MAX_WIDTH_OR_HEIGHT = 1920;

/**
 * Upload image to Supabase Storage
 */
export async function uploadProductImage(
  file: File,
  productId?: number
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'Geçersiz dosya tipi. Sadece resim dosyaları yüklenebilir.' };
    }

    // Compress image
    const options = {
      maxSizeMB: MAX_SIZE_MB,
      maxWidthOrHeight: MAX_WIDTH_OR_HEIGHT,
      useWebWorker: true,
      fileType: 'image/webp' as const,
    };

    const compressedFile = await imageCompression(file, options);

    // Create Supabase client
    const supabase = createClient();

    // Ensure bucket exists (create if not exists)
    const bucketName = 'product-images';
    
    // Check if bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error checking buckets:', bucketsError);
      return { success: false, error: 'Storage bucket kontrolü başarısız. Lütfen Supabase Storage ayarlarını kontrol edin.' };
    }

    const bucketExists = buckets?.some(b => b.name === bucketName);

    if (!bucketExists) {
      // Try to create bucket (this might fail if user doesn't have permission)
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      });

      if (createError) {
        console.error('Error creating bucket:', createError);
        return {
          success: false,
          error: `Storage bucket oluşturulamadı: ${createError.message}. Lütfen Supabase Dashboard'dan 'product-images' bucket'ını manuel olarak oluşturun.`,
        };
      }
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const fileExt = compressedFile.name.split('.').pop() || 'webp';
    const fileName = productId
      ? `${productId}/${timestamp}-${randomStr}.${fileExt}`
      : `temp/${timestamp}-${randomStr}.${fileExt}`;

    // Upload file
    const { data, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, compressedFile, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return {
        success: false,
        error: `Resim yükleme hatası: ${uploadError.message}`,
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    if (!urlData?.publicUrl) {
      return { success: false, error: 'Resim URL\'si alınamadı.' };
    }

    return { success: true, url: urlData.publicUrl };
  } catch (error: any) {
    console.error('Image upload error:', error);
    return {
      success: false,
      error: error?.message || 'Resim yükleme sırasında bir hata oluştu.',
    };
  }
}

/**
 * Upload multiple images (max 6)
 */
export async function uploadProductImages(
  files: File[],
  productId?: number
): Promise<{ success: boolean; urls?: string[]; error?: string }> {
  if (files.length > MAX_IMAGES) {
    return {
      success: false,
      error: `Maksimum ${MAX_IMAGES} resim yüklenebilir.`,
    };
  }

  const uploadPromises = files.map((file) => uploadProductImage(file, productId));
  const results = await Promise.all(uploadPromises);

  const failed = results.find((r) => !r.success);
  if (failed) {
    return { success: false, error: failed.error };
  }

  const urls = results.map((r) => r.url!).filter(Boolean);
  return { success: true, urls };
}
