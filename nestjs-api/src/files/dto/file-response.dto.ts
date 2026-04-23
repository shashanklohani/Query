import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PdfFileDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiPropertyOptional()
  originalFileName?: string;

  @ApiProperty()
  key!: string;

  @ApiProperty({ example: 'local' })
  bucket!: string;

  @ApiProperty({ example: 'application/pdf' })
  contentType!: string;

  @ApiProperty()
  size!: number;

  @ApiProperty({ example: '/uploads/example.pdf' })
  url!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

export class GetUserPdfsResponseDto {
  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiProperty()
  count!: number;

  @ApiProperty({ type: [PdfFileDto] })
  files!: PdfFileDto[];
}

export class UploadPdfResponseDto {
  @ApiProperty({ example: 'PDF uploaded successfully.' })
  message!: string;

  @ApiProperty({ type: PdfFileDto })
  file!: PdfFileDto;
}
