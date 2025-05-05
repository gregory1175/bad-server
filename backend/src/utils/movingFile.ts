import { existsSync, renameSync } from 'fs';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';

function movingFile(imagePath: string, from: string, to: string): string {
    const ext = extname(imagePath);
    const newFileName = `${randomUUID()}${ext}`;
    const imagePathTemp = join(from, imagePath);
    const imagePathPermanent = join(to, newFileName);

    if (!existsSync(imagePathTemp)) {
        throw new Error('Ошибка при сохранении файла');
    }

    renameSync(imagePathTemp, imagePathPermanent);

    return newFileName;
}

export default movingFile;
