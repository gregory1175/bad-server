import { existsSync, renameSync } from 'fs';
import { join } from 'path';

function movingFile(fileName: string, from: string, to: string): string {
    const sourcePath = join(from, fileName);
    const destPath = join(to, fileName);

    if (!existsSync(sourcePath)) {
        throw new Error('Ошибка при сохранении файла');
    }

    renameSync(sourcePath, destPath);
    return fileName;
}

export default movingFile;
