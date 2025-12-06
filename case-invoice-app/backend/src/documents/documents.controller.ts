import { 
  Controller, 
  Get, 
  Post, 
  Delete, 
  Param, 
  Query, // <--- 1. Importar Query
  UploadedFile, 
  UseInterceptors, 
  Body, 
  Res,
  NotFoundException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { Response } from 'express';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads', 
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
      },
    }),
  }))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File, 
    @Body('userId') userId: string
  ) {
    return this.documentsService.processDocument(file, userId || 'demo-user-id');
  }

  // --- ALTERAÇÃO AQUI ---
  @Get()
  async findAll(@Query('email') email?: string) { // Recebe ?email=... da URL
    return this.documentsService.findAll(email);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const doc = await this.documentsService.findOne(id);
    if (!doc) throw new NotFoundException('Documento não encontrado');
    return doc;
  }

  @Post(':id/chat')
  async chat(
    @Param('id') id: string,
    @Body('message') message: string
  ) {
    return this.documentsService.chatWithDocument(id, message);
  }

  @Get('file/:filename')
  async getFile(@Param('filename') filename: string, @Res() res: Response) {
    return res.sendFile(filename, { root: './uploads' });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }
}