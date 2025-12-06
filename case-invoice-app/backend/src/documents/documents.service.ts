import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as Tesseract from 'tesseract.js';
import Groq from 'groq-sdk';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DocumentsService {
  private prisma = new PrismaClient();
  private groq: Groq;

  constructor() {
    const apiKey = (process.env.GROQ_API_KEY || '').trim();
    this.groq = new Groq({ apiKey });
  }

  async processDocument(file: Express.Multer.File, userEmail: string) {
    // 1. Tenta encontrar o utilizador pelo e-mail
    const user = await this.prisma.user.findUnique({ where: { email: userEmail } });

    // 2. Se não existir, BLOQUEIA o upload (Segurança)
    if (!user) {
      // Apaga o arquivo que foi subido inutilmente para não sujar o servidor
      try { fs.unlinkSync(file.path); } catch(e) {}
      
      throw new UnauthorizedException('Utilizador não encontrado. Por favor, faça registo ou login.');
    }

    console.log(`Iniciando OCR para: ${file.path}`);
    const { data: { text } } = await Tesseract.recognize(file.path, 'eng+por');
    console.log('OCR Concluído.');

    // 3. Salva o documento vinculado ao ID real do utilizador
    return this.prisma.document.create({
      data: {
        title: file.originalname,
        filename: file.filename,
        ocrText: text || 'Texto não detectado.',
        userId: user.id, 
      },
    });
  }

  async findAll(email?: string) {
    const where: any = {};

    // Se um email foi enviado, filtramos pelo ID desse usuário
    if (email) {
      const user = await this.prisma.user.findUnique({ where: { email } });
      
      if (user) {
        where.userId = user.id;
      } else {
        // Se mandou um email que não existe, retorna lista vazia por segurança
        return [];
      }
    }

    return this.prisma.document.findMany({
      where, // <--- Aplica o filtro aqui
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { messages: true } } }
    });
  }

  async findOne(id: string) {
    return this.prisma.document.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } } }
    });
  }

  async chatWithDocument(documentId: string, userQuestion: string) {
    const document = await this.prisma.document.findUnique({ where: { id: documentId } });
    if (!document) throw new NotFoundException('Documento não encontrado');

    await this.prisma.message.create({
      data: { content: userQuestion, role: 'user', documentId }
    });

    try {
      const chatCompletion = await this.groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `Você é um assistente financeiro. Responda baseando-se no texto: """${document.ocrText}"""`
          },
          { role: "user", content: userQuestion }
        ],
        model: "llama-3.3-70b-versatile",
      });

      const aiResponse = chatCompletion.choices[0]?.message?.content || "Sem resposta.";

      return this.prisma.message.create({
        data: { content: aiResponse, role: 'assistant', documentId }
      });

    } catch (error: any) {
      return this.prisma.message.create({
        data: { 
          content: `Erro na IA: ${error.message}.`, 
          role: 'assistant', 
          documentId 
        }
      });
    }
  }

  async remove(id: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException("Documento não encontrado");

    await this.prisma.message.deleteMany({ where: { documentId: id } });
    await this.prisma.document.delete({ where: { id } });

    try {
      const filePath = path.join(process.cwd(), 'uploads', doc.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {
      console.error("Erro ao apagar arquivo físico:", e);
    }

    return { message: "Documento excluído com sucesso" };
  }
}