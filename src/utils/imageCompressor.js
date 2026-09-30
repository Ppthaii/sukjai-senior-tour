// ระบบบีบอัดและปรับขนาดรูปภาพอัตโนมัติบนเบราว์เซอร์ (Client-side Image Compressor)
// ป้องกันปัญหา QuotaExceededError ใน LocalStorage และลดขนาดข้อมูลเพื่อซิงค์ขึ้น Cloud ได้รวดเร็ว

/**
 * บีบอัดไฟล์รูปภาพ (File หรือ Blob) หรือ DataURL ให้มีขนาดกะทัดรัด (ไม่เกิน 1000px, คุณภาพ 0.78)
 * จากเดิม 3 - 8 MB ให้เหลือเพียง ~40 - 90 KB โดยที่ยังคงความคมชัดสวยงาม
 * @param {File|Blob|string} imageSource - ไฟล์ภาพจาก <input type="file"> หรือ DataURL string
 * @param {number} maxDimension - ขนาดด้านกว้างหรือสูงสูงสุด (ค่าเริ่มต้น 1000px)
 * @param {number} quality - คุณภาพของภาพ 0.1 - 1.0 (ค่าเริ่มต้น 0.78)
 * @returns {Promise<string>} DataURL ของภาพที่บีบอัดแล้ว
 */
export function compressImage(imageSource, maxDimension = 800, quality = 0.72) {
  return new Promise((resolve, reject) => {
    // กรณีเป็น URL ภายนอก (http:// หรือ https://) ที่ไม่ใช่ DataURL
    if (typeof imageSource === 'string' && (imageSource.startsWith('http://') || imageSource.startsWith('https://'))) {
      return resolve(imageSource);
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        let width = img.width;
        let height = img.height;

        // คำนวณอัตราส่วนย่อรูป
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(typeof imageSource === 'string' ? imageSource : '');
        }

        // ปรับแต่งคุณภาพการวาด
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // วาดภาพลง Canvas
        ctx.drawImage(img, 0, 0, width, height);

        // แปลงเป็น WebP (ถ้าเบราว์เซอร์รองรับ) หรือ JPEG
        let compressedDataUrl;
        try {
          compressedDataUrl = canvas.toDataURL('image/webp', quality);
          // หากเบราว์เซอร์แปลง WebP ไม่ได้จะคืน image/png ซึ่งอาจใหญ่ ให้ fallback เป็น jpeg
          if (!compressedDataUrl.startsWith('data:image/webp')) {
            compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          }
        } catch {
          compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(compressedDataUrl);
      } catch (err) {
        console.warn('Image compression canvas error, fallback to original:', err);
        resolve(typeof imageSource === 'string' ? imageSource : '');
      }
    };

    img.onerror = (err) => {
      console.warn('Failed to load image for compression:', err);
      // Fallback
      if (typeof imageSource === 'string') {
        resolve(imageSource);
      } else {
        reject(err);
      }
    };

    if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else if (imageSource instanceof Blob) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result;
        } else {
          reject(new Error('FileReader empty result'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageSource);
    } else {
      resolve('');
    }
  });
}
