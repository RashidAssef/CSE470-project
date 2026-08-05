import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});

const allowedMime =
  /^(application\/pdf|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|image\/(jpeg|png|gif|webp))$/;

const allowedExt = /\.(pdf|docx|jpe?g|png|gif|webp)$/i;

export const uploadSingle = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const extOk = allowedExt.test(file.originalname);
    const mimeOk = allowedMime.test(file.mimetype);
    if (mimeOk && extOk) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOCX, and image files (JPG, PNG, GIF, WebP) are allowed.'));
    }
  },
}).single('file');
