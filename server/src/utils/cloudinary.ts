import cloudinary from '../config/cloudinary';

interface UploadResult {
  url: string;
  publicId: string;
}

export const uploadImage = (fileBuffer: Buffer, folder: string): Promise<UploadResult> =>
  new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder,
        transformation: [
          { width: 1200, height: 1600, crop: 'limit' },
          { quality: 'auto:good' },
          { fetch_format: 'auto' },
        ],
        allowed_formats: ['jpg', 'jpeg', 'png'],
      },
      (error, result) => {
        if (error || !result) return reject(error || new Error('Upload echoue'));
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    ).end(fileBuffer);
  });

export const deleteImage = (publicId: string): Promise<void> =>
  cloudinary.uploader.destroy(publicId).then(() => undefined);
