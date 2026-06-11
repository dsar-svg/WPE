import { supabase } from './supabase';

const MAX_WIDTH = 800;
const QUALITY = 0.7;

async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      if (w > MAX_WIDTH) {
        h = h * (MAX_WIDTH / w);
        w = MAX_WIDTH;
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas context not available')); return; }
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Compression failed'));
        },
        'image/webp',
        QUALITY
      );
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    const reader = new FileReader();
    reader.onload = () => { img.src = reader.result as string; };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export async function uploadImage(file: File): Promise<string> {
  const blob = await compressImage(file);
  const ext = 'webp';
  const fileName = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from('images')
    .upload(fileName, blob, {
      contentType: 'image/webp',
      upsert: false,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data: publicUrl } = supabase.storage
    .from('images')
    .getPublicUrl(fileName);

  return publicUrl.publicUrl;
}
