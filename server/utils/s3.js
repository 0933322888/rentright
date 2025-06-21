import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

const s3 = new S3Client({
    region: process.env.AWS_REGION || 'ca-central-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const BUCKET = process.env.AWS_S3_BUCKET || 'rentright-data';
const PUBLIC_URL = 'https://rentright-data.s3.ca-central-1.amazonaws.com/';

export const uploadFileToS3 = async (buffer, key, mimetype) => {
    const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: mimetype,
    });
    await s3.send(command);
    return getS3FileUrl(key);
};

export const deleteFileFromS3 = async (key) => {
    const command = new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: key,
    });
    await s3.send(command);
};

export const getS3FileUrl = (key) => {
    return `${PUBLIC_URL}${key}`;
};

export const generateS3Key = (folder, originalName) => {
    const ext = originalName.split('.').pop();
    return `${folder}/${uuidv4()}.${ext}`;
}; 