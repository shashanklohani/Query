import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthenticatedRequest } from '../auth/authenticated-request.interface';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  GetUserPdfsResponseDto,
  UploadPdfResponseDto,
} from './dto/file-response.dto';
import { QueryPdfDto, QueryPdfResponseDto } from './dto/query-pdf.dto';
import { FilesService } from './files.service';
import { UploadPdfDto } from './dto/upload-pdf.dto';

type UploadedPdfRequestFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
};

type UserPdfListResponse = Awaited<ReturnType<FilesService['getUserPdfs']>>;
type UploadPdfResponse = Awaited<ReturnType<FilesService['uploadPdf']>>;
type QueryPdfResponse = Awaited<ReturnType<FilesService['queryPdf']>>;

@ApiTags('Files')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get('users/:userId/pdfs')
  @ApiOperation({ summary: 'Get all uploaded PDFs for a user' })
  @ApiParam({
    name: 'userId',
    type: 'string',
    format: 'uuid',
    description: 'User UUID',
  })
  @ApiOkResponse({ type: GetUserPdfsResponseDto })
  getUserPdfs(
    @Param('userId', new ParseUUIDPipe()) userId: string,
  ): Promise<UserPdfListResponse> {
    return this.filesService.getUserPdfs(userId);
  }

  @Post('upload-pdf')
  @ApiOperation({ summary: 'Upload a PDF for the authenticated user' })
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadPdfDto })
  @ApiOkResponse({ type: UploadPdfResponseDto })
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadPdf(
    @UploadedFile() file: UploadedPdfRequestFile,
    @Req() request: AuthenticatedRequest,
  ): Promise<UploadPdfResponse> {
    if (!file) {
      throw new BadRequestException('A PDF file is required.');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF files are allowed.');
    }

    const userId = request.user.sub;

    return this.filesService.uploadPdf(file, userId);
  }

  @Post('query')
  @ApiOperation({ summary: 'Query an uploaded PDF for the authenticated user' })
  @ApiBearerAuth()
  @ApiOkResponse({ type: QueryPdfResponseDto })
  @UseGuards(JwtAuthGuard)
  queryPdf(
    @Req() request: AuthenticatedRequest,
    @Body() payload: QueryPdfDto,
  ): Promise<QueryPdfResponse> {
    return this.filesService.queryPdf(payload, request.user.sub);
  }
}
