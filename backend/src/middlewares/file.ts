import { randomUUID } from 'crypto';
import { Request, Express } from 'express';
import multer from 'multer';
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

// Проверяем магические байты
const checkMagicNumbers = (filePath: string, mimetype: string): boolean => {
    const buffer = fs.readFileSync(filePath);

    if (mimetype === 'image/png') {
        return buffer.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]));
    }
    if (mimetype === 'image/jpeg' || mimetype === 'image/jpg') {
        return buffer.slice(0, 3).equals(Buffer.from([0xFF, 0xD8, 0xFF]));
    }
    if (mimetype === 'image/gif') {
        return buffer.slice(0, 4).equals(Buffer.from([0x47, 0x49, 0x46, 0x38]));
    }
    if (mimetype === 'image/svg+xml') {
        const str = buffer.toString('utf-8', 0, 100).trim();
        return str.startsWith('<svg');
    }

    return false;
};

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
    const tempPath = join(uploadDir, `${randomUUID()}${extname(file.originalname)}`);
    const writeStream = fs.createWriteStream(tempPath);

    file.stream.pipe(writeStream);

    writeStream.on('finish', () => {
        try {
            const isValid = checkMagicNumbers(tempPath, file.mimetype);
            fs.unlinkSync(tempPath);

            if (!isValid) {
                return cb(null, false);
            }
            cb(null, true);
        } catch (err) {
            cb(null, false);
        }
    });

    writeStream.on('error', (err: null)=> {
        cb(err, false);
    });
};

export default multer({ storage, fileFilter });
