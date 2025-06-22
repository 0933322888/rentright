import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if AWS credentials are configured
const hasAwsCredentials = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;

console.log('Environment variables check:');
console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? 'SET' : 'NOT SET');
console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'SET' : 'NOT SET');
console.log('AWS_REGION:', process.env.AWS_REGION);
console.log('AWS_S3_BUCKET:', process.env.AWS_S3_BUCKET);
console.log('hasAwsCredentials:', hasAwsCredentials);

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
    console.warn('AWS credentials not found. Using local file storage as fallback.');
    console.warn('Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables for S3 storage.');
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
    console.log('uploadFileToS3 called with:', { key, mimetype, bufferSize: buffer.length });
    console.log('useLocalStorage:', useLocalStorage);
    console.log('hasAwsCredentials:', hasAwsCredentials);
    
    if (useLocalStorage) {
        // Fallback to local storage
        console.log('Using local storage fallback');
        return uploadFileLocally(buffer, key, mimetype);
    }

    if (!s3) {
        console.log('S3 client not initialized');
        throw new Error('AWS S3 is not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.');
    }

    try {
        console.log('Attempting S3 upload...');
        const command = new PutObjectCommand({
            Bucket: BUCKET,
            Key: key,
            Body: buffer,
            ContentType: mimetype,
        });
        await s3.send(command);
        const url = getS3FileUrl(key);
        console.log('S3 upload successful:', url);
        return url;
    } catch (error) {
        console.error('S3 upload error:', error);
        if (error.name === 'InvalidAccessKeyId' || error.name === 'SignatureDoesNotMatch') {
            throw new Error('Invalid AWS credentials. Please check your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.');
        }
        throw new Error(`S3 upload failed: ${error.message}`);
    }
};

const uploadFileLocally = async (buffer, key, mimetype) => {
    try {
        console.log('uploadFileLocally called with:', { key, mimetype, bufferSize: buffer.length });
        
        const uploadsDir = path.join(__dirname, '../uploads');
        const filePath = path.join(uploadsDir, key);
        
        console.log('Uploads directory:', uploadsDir);
        console.log('File path:', filePath);
        
        // Ensure directory exists
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            console.log('Creating directory:', dir);
            fs.mkdirSync(dir, { recursive: true });
        }
        
        // Write file
        console.log('Writing file to disk...');
        fs.writeFileSync(filePath, buffer);
        console.log('File written successfully');
        
        const url = getLocalFileUrl(key);
        console.log('Local file URL:', url);
        return url;
    } catch (error) {
        console.error('Local file upload error:', error);
        throw new Error(`Local file upload failed: ${error.message}`);
    }
};

export const deleteFileFromS3 = async (key) => {
    if (useLocalStorage) {
        // Fallback to local deletion
        return deleteFileLocally(key);
    }

    if (!s3) {
        console.warn('AWS S3 is not configured. Skipping file deletion.');
        return;
    }

    try {
        const command = new DeleteObjectCommand({
            Bucket: BUCKET,
            Key: key,
        });
        await s3.send(command);
    } catch (error) {
        console.error('S3 delete error:', error);
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
        console.error('Local file delete error:', error);
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