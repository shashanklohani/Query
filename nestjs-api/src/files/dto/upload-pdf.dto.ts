import { ApiProperty } from '@nestjs/swagger';

export class UploadPdfDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'PDF file to upload',
  })
  file!: unknown;
}
