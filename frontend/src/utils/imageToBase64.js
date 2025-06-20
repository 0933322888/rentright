/**
 * Converts an image file to base64 string
 * @param {File} file - The image file to convert
 * @returns {Promise<string>} - Promise that resolves to base64 string
 */
export const convertImageToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      reject(new Error('File must be an image'));
      return;
    }

    const reader = new FileReader();
    
    reader.onload = () => {
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
};

/**
 * Converts multiple image files to base64 strings
 * @param {File[]} files - Array of image files to convert
 * @returns {Promise<string[]>} - Promise that resolves to array of base64 strings
 */
export const convertImagesToBase64 = async (files) => {
  if (!Array.isArray(files)) {
    throw new Error('Files must be an array');
  }

  const promises = files.map(file => convertImageToBase64(file));
  return Promise.all(promises);
};

/**
 * Converts an image URL to base64 string
 * @param {string} imageUrl - The URL of the image
 * @returns {Promise<string>} - Promise that resolves to base64 string
 */
export const convertImageUrlToBase64 = (imageUrl) => {
  return new Promise((resolve, reject) => {
    if (!imageUrl) {
      reject(new Error('No image URL provided'));
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous'; // Handle CORS issues
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = img.width;
      canvas.height = img.height;
      
      ctx.drawImage(img, 0, 0);
      
      try {
        // Get base64 string from canvas
        const base64String = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        resolve(base64String);
      } catch (error) {
        reject(new Error('Failed to convert image to base64'));
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image from URL'));
    };
    
    img.src = imageUrl;
  });
};

/**
 * Converts multiple image URLs to base64 strings
 * @param {string[]} imageUrls - Array of image URLs to convert
 * @returns {Promise<string[]>} - Promise that resolves to array of base64 strings
 */
export const convertImageUrlsToBase64 = async (imageUrls) => {
  if (!Array.isArray(imageUrls)) {
    throw new Error('Image URLs must be an array');
  }

  const promises = imageUrls.map(url => convertImageUrlToBase64(url));
  return Promise.all(promises);
};

/**
 * Validates if a string is a valid base64 image
 * @param {string} base64String - The base64 string to validate
 * @returns {boolean} - True if valid base64 image, false otherwise
 */
export const isValidBase64Image = (base64String) => {
  if (!base64String || typeof base64String !== 'string') {
    return false;
  }

  // Check if it's a valid base64 string
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(base64String)) {
    return false;
  }

  // Try to decode and check if it's a valid image
  try {
    const binaryString = atob(base64String);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Check for common image file signatures
    const signatures = {
      jpeg: [0xFF, 0xD8, 0xFF],
      png: [0x89, 0x50, 0x4E, 0x47],
      gif: [0x47, 0x49, 0x46],
      webp: [0x52, 0x49, 0x46, 0x46]
    };

    for (const [format, signature] of Object.entries(signatures)) {
      if (signature.every((byte, index) => bytes[index] === byte)) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    return false;
  }
}; 