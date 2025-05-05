import { Request, Express } from 'express'
import multer, { FileFilterCallback } from 'multer'
import { resolve } from 'path'

type DestinationCallback = (error: Error | null, destination: string) => void
type FileNameCallback = (error: Error | null, filename: string) => void

const storage = multer.diskStorage({
    destination: (
        _req: Request,
        _file: Express.Multer.File,
        cb: DestinationCallback
    ) => {
        const uploadPath = process.env.UPLOAD_PATH_TEMP
            ? `../public/${process.env.UPLOAD_PATH_TEMP}`
            : '../public'

        const destination = resolve(__dirname, uploadPath)
        cb(null, destination)
    },

    filename: (
        _req: Request,
        file: Express.Multer.File,
        cb: FileNameCallback
    ) => {
        const safeFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')
        cb(null, safeFileName)
    },
})

const allowedTypes = [
    'image/png',
    'image/jpg',
    'image/jpeg',
    'image/gif',
    'image/svg+xml',
]

const fileFilter = (
    _req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
) => {
    if (!allowedTypes.includes(file.mimetype)) {
        return cb(null, false)
    }

    return cb(null, true)
}

export default multer({ storage, fileFilter })
