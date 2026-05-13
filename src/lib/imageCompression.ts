/**
 * Compresses an image file to be under 1MB for Firestore storage.
 * @param file The image file to compress
 * @param maxDimension The maximum width or height of the image
 * @param targetSize The maximum size in bytes
 * @returns Base64 string of the compressed image
 */
export async function compressImage(file: File, maxDimension = 1600, targetSize = 1048487): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let { width, height } = img;
        
        // Initial resize check
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
        if (!ctx) return reject('Failed to get canvas context');
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.9;
        let base64 = canvas.toDataURL('image/jpeg', quality);

        // Iteratively reduce quality until under targetSize
        // Note: size of base64 string is approx 4/3 of actual bytes
        while (base64.length > targetSize && quality > 0.1) {
          quality -= 0.1;
          base64 = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(base64);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}
