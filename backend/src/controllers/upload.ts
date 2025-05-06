import { NextFunction, Request, Response } from 'express';
import { constants } from 'http2';
import BadRequestError from '../errors/bad-request-error';

const MIN_SIZE = 2 * 1024; // 2 KB
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export const uploadFile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (!req.file) {
        return next(new BadRequestError('Файл не загружен'));
    }
    if (req.file.size < MIN_SIZE) {
        return next(new BadRequestError('Файл слишком маленький (минимум 2 KB)'));
    }
    if (req.file.size > MAX_SIZE) {
        return next(new BadRequestError('Размер файла слишком большой'))
    }
    if (!req.file.mimetype.startsWith('image/')) {
        return next(new BadRequestError('Загружаемый файл должен быть изображением'))
    }
    try {
        const fileName = process.env.UPLOAD_PATH
            ? `/${process.env.UPLOAD_PATH}/${req.file.filename}`
            : `/${req.file?.filename}`;

        return res.status(constants.HTTP_STATUS_CREATED).send({
            fileName,
            originalName: req.file?.originalname,
        });
    } catch (error) {
        return next(error);
    }
};

export default {};