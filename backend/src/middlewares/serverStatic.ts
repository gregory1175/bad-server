import { NextFunction, Request, Response } from 'express'
import fs from 'fs'
import path from 'path'

interface FsError extends Error {
    code?: string
}

export default function serveStatic(baseDir: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Определяем полный путь к запрашиваемому файлу
            const resolvedPath = path.resolve(baseDir, `.${req.path}`)

            // Проверяем, что путь не выходит за пределы baseDir
            if (!resolvedPath.startsWith(baseDir)) {
                return res.status(403).send('Forbidden')
            }

            // Проверяем, существует ли файл и является ли он файлом, а не директорией
            const stats = await fs.promises.stat(resolvedPath)

            if (!stats.isFile()) {
                // Если это директория или что-то другое, передаем дальше
                return next()
            }

            // Отправляем файл клиенту
            return res.sendFile(resolvedPath)
        }  catch (err) {
            // Проверяем, что err имеет тип FsError (ошибка с кодом)
            if ((err as FsError).code === 'ENOENT') {
                // Файл не существует, передаем дальше
                return next()
            }
            // Если это не ошибка типа FsError или другая ошибка, передаем её в следующий обработчик
            next(err)
        }
    }
}
