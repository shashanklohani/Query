import { Injectable } from '@nestjs/common';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

type SaveFileInput = {
  buffer: Buffer;
  fileName: string;
};

@Injectable()
export class LocalFileStorageService {
  private readonly storageRoot = resolve(
    process.env.FILE_STORAGE_ROOT ?? 'uploads',
  );

  async saveFile({ buffer, fileName }: SaveFileInput): Promise<string> {
    await mkdir(this.storageRoot, { recursive: true });

    const absolutePath = join(this.storageRoot, fileName);

    await writeFile(absolutePath, buffer);

    return absolutePath;
  }

  getPublicUrl(fileName: string): string {
    return `/uploads/${fileName}`;
  }

  getStorageRoot(): string {
    return this.storageRoot;
  }
}
