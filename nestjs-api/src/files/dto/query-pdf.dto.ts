import { ApiProperty } from '@nestjs/swagger';

export class QueryPdfDto {
  @ApiProperty({ format: 'uuid' })
  pdfId!: string;

  @ApiProperty({ minLength: 1 })
  prompt!: string;

  @ApiProperty({ minLength: 1 })
  context!: string;
}

export class QueryPdfResponseDto {
  @ApiProperty()
  answer!: string;

  @ApiProperty({ format: 'uuid' })
  pdfId!: string;

  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiProperty()
  model!: string;
}
