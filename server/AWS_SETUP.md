# AWS S3 Setup Guide

## Overview
This application uses AWS S3 for file storage (images, documents, etc.). If AWS credentials are not configured, the application will fall back to local file storage.

## Option 1: Use Local Storage (Recommended for Development)
If you don't have AWS S3 set up, the application will automatically use local file storage. Files will be saved in the `uploads/` directory and served from `http://localhost:5000/uploads/`.

## Option 2: Configure AWS S3 (Recommended for Production)

### 1. Create an AWS Account
- Go to [AWS Console](https://aws.amazon.com/)
- Create a new account if you don't have one

### 2. Create an S3 Bucket
- Go to S3 service in AWS Console
- Click "Create bucket"
- Choose a unique bucket name (e.g., `your-app-name-files`)
- Select your preferred region (e.g., `ca-central-1`)
- Keep default settings for now

### 3. Create IAM User
- Go to IAM service in AWS Console
- Click "Users" → "Add user"
- Give it a name (e.g., `s3-upload-user`)
- Select "Programmatic access"
- Click "Next"

### 4. Attach S3 Policy
- Click "Attach existing policies directly"
- Search for "S3" and select "AmazonS3FullAccess" (or create a more restrictive custom policy)
- Click "Next" and "Create user"

### 5. Get Access Keys
- After creating the user, click on the user name
- Go to "Security credentials" tab
- Click "Create access key"
- Select "Application running outside AWS"
- Copy the Access Key ID and Secret Access Key

### 6. Configure Environment Variables
Create a `.env` file in the server directory with:

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
AWS_REGION=ca-central-1
AWS_S3_BUCKET=your-bucket-name-here

# Other required variables
MONGODB_URI=mongodb://localhost:27017/rentright
JWT_SECRET=your_jwt_secret_key_here
DEV_BACKEND_PORT=5000
NODE_ENV=development
```

### 7. Test the Configuration
Restart your server and try uploading a file. If configured correctly, files will be uploaded to S3 instead of local storage.

## Security Notes
- Never commit your `.env` file to version control
- Use IAM roles instead of access keys in production (AWS ECS, EC2, etc.)
- Consider using more restrictive S3 policies for production
- Regularly rotate your access keys

## Troubleshooting

### "Resolved credential object is not valid"
- Check that your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are correct
- Ensure the IAM user has S3 permissions
- Verify the bucket name and region are correct

### "Access Denied" errors
- Check that the IAM user has permission to access the S3 bucket
- Verify the bucket name is correct
- Ensure the bucket is in the correct region

### Files not uploading
- Check the server logs for error messages
- Verify all environment variables are set correctly
- Ensure the uploads directory exists and is writable 