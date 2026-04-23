import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DatabaseService } from '../database.service';
import { LocalFileStorageService } from '../storage/local-file-storage.service';

type UploadedPdfFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
};

type UserLookupRow = {
  id: string;
};

type PdfUploadRow = {
  id: string;
  user_id: string;
  original_file_name: string;
  s3_key: string;
  bucket: string;
  content_type: string;
  size_bytes: string;
  file_url: string;
  created_at: Date;
};

type PdfFileRecord = {
  id: string;
  userId: string;
  originalFileName?: string;
  key: string;
  bucket: string;
  contentType: string;
  size: number;
  url: string;
  createdAt: Date;
};

type GetUserPdfsResponse = {
  userId: string;
  count: number;
  files: PdfFileRecord[];
};

type UploadPdfResponse = {
  message: string;
  file: Omit<PdfFileRecord, 'originalFileName'>;
};

type QueryPdfPayload = {
  pdfId: string;
  prompt: string;
  context: string;
};

type QueryPdfResponse = {
  answer: string;
  pdfId: string;
  userId: string;
  model: string;
};

type PythonQueryResponse = {
  answer: string;
  pdf_id: string;
  user_id: string;
  model: string;
};

@Injectable()
export class FilesService {
  private readonly bucket = 'local';
  private readonly queryServiceBaseUrl =
    process.env.PYTHON_QUERY_SERVICE_URL ?? 'http://localhost:8001/api';

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly localFileStorageService: LocalFileStorageService,
  ) {}

  async getUserPdfs(userId: string): Promise<GetUserPdfsResponse> {
    if (!userId) {
      throw new BadRequestException('userId is required.');
    }

    const userResult = await this.databaseService.query<UserLookupRow>(
      'SELECT id FROM users WHERE id = $1 LIMIT 1',
      [userId],
    );

    if (userResult.rows.length === 0) {
      throw new NotFoundException('User not found.');
    }

    const uploadsResult = await this.databaseService.query<PdfUploadRow>(
      `SELECT id, user_id, original_file_name, s3_key, bucket, content_type, size_bytes, file_url, created_at
       FROM pdf_uploads
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId],
    );

    return {
      userId,
      count: uploadsResult.rows.length,
      files: uploadsResult.rows.map((upload) => ({
        id: upload.id,
        userId: upload.user_id,
        originalFileName: upload.original_file_name,
        key: upload.s3_key,
        bucket: upload.bucket,
        contentType: upload.content_type,
        size: Number(upload.size_bytes),
        url: upload.file_url,
        createdAt: upload.created_at,
      })),
    };
  }

  async uploadPdf(
    file: UploadedPdfFile,
    userId: string,
  ): Promise<UploadPdfResponse> {
    if (!userId) {
      throw new BadRequestException('userId is required.');
    }

    const userResult = await this.databaseService.query<UserLookupRow>(
      'SELECT id FROM users WHERE id = $1 LIMIT 1',
      [userId],
    );

    if (userResult.rows.length === 0) {
      throw new NotFoundException('User not found.');
    }

    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `${randomUUID()}-${sanitizedName}`;
    const fileUrl = this.localFileStorageService.getPublicUrl(key);

    await this.localFileStorageService.saveFile({
      buffer: file.buffer,
      fileName: key,
    });

    const uploadResult = await this.databaseService.query<{
      id: string;
      created_at: Date;
    }>(
      `INSERT INTO pdf_uploads
         (user_id, original_file_name, s3_key, bucket, content_type, size_bytes, file_url)
       VALUES
         ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, created_at`,
      [
        userId,
        file.originalname,
        key,
        this.bucket,
        file.mimetype,
        file.size,
        fileUrl,
      ],
    );

    const upload = uploadResult.rows[0];

    await this.createStore(key);

    return {
      message: 'PDF uploaded successfully.',
      file: {
        id: upload.id,
        userId,
        key,
        bucket: this.bucket,
        contentType: file.mimetype,
        size: file.size,
        url: fileUrl,
        createdAt: upload.created_at,
      },
    };
  }

  async queryPdf(
    payload: QueryPdfPayload,
    userId: string,
  ): Promise<QueryPdfResponse> {
    if (!userId) {
      throw new BadRequestException('userId is required.');
    }

    const trimmedPrompt = payload.prompt.trim();
    const trimmedContext = payload.context.trim();

    if (!trimmedPrompt) {
      throw new BadRequestException('prompt is required.');
    }

    if (!trimmedContext) {
      throw new BadRequestException('context is required.');
    }

    const pdfResult = await this.databaseService.query<PdfUploadRow>(
      `SELECT id, user_id, original_file_name, s3_key, bucket, content_type, size_bytes, file_url, created_at
       FROM pdf_uploads
       WHERE id = $1 AND user_id = $2
       LIMIT 1`,
      [payload.pdfId, userId],
    );

    if (pdfResult.rows.length === 0) {
      throw new NotFoundException('PDF not found.');
    }

    const pdf = pdfResult.rows[0];
    const response = await fetch(`${this.queryServiceBaseUrl}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_name: pdf.s3_key,
        prompt: trimmedPrompt,
        context: trimmedContext,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      throw new InternalServerErrorException(
        `Failed to query uploaded PDF: ${errorText || response.statusText}`,
      );
    }

    const data = (await response.json()) as PythonQueryResponse;

    return {
      answer: data.answer,
      pdfId: pdf.id,
      userId,
      model: data.model,
    };
  }

  private async createStore(s3Key: string): Promise<void> {
    const response = await fetch(`${this.queryServiceBaseUrl}/create-store`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ s3_key: s3Key }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      throw new InternalServerErrorException(
        `Failed to create store for uploaded PDF: ${errorText || response.statusText}`,
      );
    }
  }
}
