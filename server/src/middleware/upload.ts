import multer from 'multer';
import { AppError } from './errorHandler';

const storage = multer.memoryStorage();

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
  if (!allowed.includes(file.mimetype)) {
    return cb(new AppError(400, 'VALIDATION_ERROR', 'Format d\'image invalide (JPG/PNG uniquement)'));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo
});

export const uploadSingle = (fieldName: string) => upload.single(fieldName);
