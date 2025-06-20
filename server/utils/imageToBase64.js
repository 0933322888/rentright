import fs from 'fs';
import path from 'path';

/**
 * Converts an image file to base64 string (server-side)
 * @param {string} filePath - Path to the image file
 * @returns {Promise<string>} - Promise that resolves to base64 string
 */
export const convertImageFileToBase64 = (filePath) => {
  return new Promise((resolve, reject) => {
    if (!filePath) {
      reject(new Error('No file path provided'));
      return;
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      reject(new Error('File does not exist'));
      return;
    }

    try {
      // Read file as buffer
      const imageBuffer = fs.readFileSync(filePath);
      
      // Convert to base64
      const base64String = imageBuffer.toString('base64');
      
      // Get file extension to determine MIME type
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp'
      };
      
      const mimeType = mimeTypes[ext] || 'image/jpeg';
      
      resolve(base64String);
    } catch (error) {
      reject(new Error(`Failed to convert image to base64: ${error.message}`));
    }
  });
};

/**
 * Converts multiple image files to base64 strings
 * @param {string[]} filePaths - Array of file paths to convert
 * @returns {Promise<string[]>} - Promise that resolves to array of base64 strings
 */
export const convertImageFilesToBase64 = async (filePaths) => {
  if (!Array.isArray(filePaths)) {
    throw new Error('File paths must be an array');
  }

  const promises = filePaths.map(filePath => convertImageFileToBase64(filePath));
  return Promise.all(promises);
};

/**
 * Converts a buffer to base64 string
 * @param {Buffer} buffer - The image buffer to convert
 * @returns {string} - Base64 string
 */
export const convertBufferToBase64 = (buffer) => {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error('Input must be a Buffer');
  }
  
  return buffer.toString('base64');
};

/**
 * Converts multiple buffers to base64 strings
 * @param {Buffer[]} buffers - Array of buffers to convert
 * @returns {string[]} - Array of base64 strings
 */
export const convertBuffersToBase64 = (buffers) => {
  if (!Array.isArray(buffers)) {
    throw new Error('Buffers must be an array');
  }

  return buffers.map(buffer => convertBufferToBase64(buffer));
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

  try {
    // Try to decode
    const buffer = Buffer.from(base64String, 'base64');
    
    // Check for common image file signatures
    const signatures = {
      jpeg: [0xFF, 0xD8, 0xFF],
      png: [0x89, 0x50, 0x4E, 0x47],
      gif: [0x47, 0x49, 0x46],
      webp: [0x52, 0x49, 0x46, 0x46]
    };

    for (const [format, signature] of Object.entries(signatures)) {
      if (signature.every((byte, index) => buffer[index] === byte)) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    return false;
  }
};

/**
 * Gets the MIME type from a base64 string
 * @param {string} base64String - The base64 string
 * @returns {string|null} - MIME type or null if not found
 */
export const getMimeTypeFromBase64 = (base64String) => {
  if (!isValidBase64Image(base64String)) {
    return null;
  }

  try {
    const buffer = Buffer.from(base64String, 'base64');
    
    // Check file signatures
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      return 'image/jpeg';
    }
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      return 'image/png';
    }
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
      return 'image/gif';
    }
    if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
      return 'image/webp';
    }
    
    return null;
  } catch (error) {
    return null;
  }
}; 