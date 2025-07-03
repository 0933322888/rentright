import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { Readable } from 'stream';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if AWS credentials are configured
const hasAwsCredentials = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;

  // Environment variables check

let s3 = null;
let useLocalStorage = false;

if (hasAwsCredentials) {
    s3 = new S3Client({
        region: process.env.AWS_REGION || 'ca-central-1',
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
    });
} else {
      // AWS credentials not found. Using local file storage as fallback.
    useLocalStorage = true;
    
    // Create local uploads directory
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }
}

const BUCKET = process.env.AWS_S3_BUCKET || 'rentright-data';
const PUBLIC_URL = 'https://rentright-data.s3.ca-central-1.amazonaws.com/';
const LOCAL_URL = process.env.LOCAL_FILE_URL || 'http://localhost:5000/uploads/';

export const uploadFileToS3 = async (buffer, key, mimetype) => {
      // Storage configuration
    
    if (useLocalStorage) {
        // Fallback to local storage
        // Using local storage fallback
        return uploadFileLocally(buffer, key, mimetype);
    }

    if (!s3) {
        // S3 client not initialized
        throw new Error('AWS S3 is not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.');
    }

    try {
        // Attempting S3 upload
        const command = new PutObjectCommand({
            Bucket: BUCKET,
            Key: key,
            Body: buffer,
            ContentType: mimetype,
        });
        await s3.send(command);
        const url = getS3FileUrl(key);
        // S3 upload successful
        return url;
    } catch (error) {
        // S3 upload error
        if (error.name === 'InvalidAccessKeyId' || error.name === 'SignatureDoesNotMatch') {
            throw new Error('Invalid AWS credentials. Please check your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.');
        }
        throw new Error(`S3 upload failed: ${error.message}`);
    }
};

const uploadFileLocally = async (buffer, key, mimetype) => {
    try {
        // uploadFileLocally called
        
        const uploadsDir = path.join(__dirname, '../uploads');
        const filePath = path.join(uploadsDir, key);
        
        // File path setup
        
        // Ensure directory exists
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            // Creating directory
            fs.mkdirSync(dir, { recursive: true });
        }
        
        // Write file
        // Writing file to disk
        fs.writeFileSync(filePath, buffer);
        // File written successfully
        
        const url = getLocalFileUrl(key);
        // Local file URL
        return url;
    } catch (error) {
        // Local file upload error
        throw new Error(`Local file upload failed: ${error.message}`);
    }
};

export const deleteFileFromS3 = async (key) => {
    if (useLocalStorage) {
        // Fallback to local deletion
        return deleteFileLocally(key);
    }

    if (!s3) {
        // AWS S3 is not configured. Skipping file deletion.
        return;
    }

    try {
        const command = new DeleteObjectCommand({
            Bucket: BUCKET,
            Key: key,
        });
        await s3.send(command);
    } catch (error) {
        // S3 delete error
        // Don't throw error for deletions as they're not critical
    }
};

const deleteFileLocally = async (key) => {
    try {
        const uploadsDir = path.join(__dirname, '../uploads');
        const filePath = path.join(uploadsDir, key);
        
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (error) {
        // Local file delete error
        // Don't throw error for deletions as they're not critical
    }
};

export const getS3FileUrl = (key) => {
    return `${PUBLIC_URL}${key}`;
};

export const getLocalFileUrl = (key) => {
    return `${LOCAL_URL}${key}`;
};

export const generateS3Key = (folder, originalName) => {
    const ext = originalName.split('.').pop();
    return `${folder}/${uuidv4()}.${ext}`;
};

export const getFileFromS3 = async (key) => {
    if (useLocalStorage) {
        // Fallback to local file read
        const uploadsDir = path.join(__dirname, '../uploads');
        const filePath = path.join(uploadsDir, key);
        return fs.readFileSync(filePath);
    }

    if (!s3) {
        throw new Error('AWS S3 is not configured.');
    }

    const command = new GetObjectCommand({
        Bucket: BUCKET,
        Key: key,
    });
    const response = await s3.send(command);

    // Convert stream to buffer
    return await streamToBuffer(response.Body);
};

const streamToBuffer = async (stream) => {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
    });
}; 