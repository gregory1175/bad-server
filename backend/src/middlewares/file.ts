import { randomUUID } from 'crypto';
import { Request, Express } from 'express';
import multer, { FileFilterCallback } from 'multer';
import { extname, join } from 'path';
import fs from 'fs';

const uploadDir = process.env.UPLOAD_PATH_TEMP
    ? join(__dirname, `../public/${process.env.UPLOAD_PATH_TEMP}`)
    : join(__dirname, '../public');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (
        _req: Request,
        _file: Express.Multer.File,
        cb: (error: Error | null, destination: string) => void
    ) => {
        cb(null, uploadDir);
    },

    filename: (
        _req: Request,
        file: Express.Multer.File,
        cb: (error: Error | null, filename: string) => void
    ) => {
        const uniqueName = `${randomUUID()}${extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});

const allowedTypes = [
    'image/png',
    'image/jpg',
    'image/jpeg',
    'image/gif',
    'image/svg+xml',
];

const fileFilter = (
    _req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
) => {
    if (!allowedTypes.includes(file.mimetype)) {
        return cb(null, false);
    }
    return cb(null, true);
};

export default multer({ storage, fileFilter });
