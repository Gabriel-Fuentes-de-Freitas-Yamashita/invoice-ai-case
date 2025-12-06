import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  private prisma = new PrismaClient();

  // --- REGISTRO ---
  async register(data: { email: string; password: string; name: string }) {
    console.log(`\n--- [Auth] Iniciando Registro: ${data.email} ---`);

    // 1. Verifica se já existe
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    
    if (existing) {
      console.log(`❌ [Auth] Erro: E-mail ${data.email} já existe no banco (ID: ${existing.id})`);
      throw new ConflictException('Este e-mail já está cadastrado.');
    } else {
      console.log(`✅ [Auth] E-mail disponível. Criando usuário...`);
    }

    // 2. Criptografa a senha
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // 3. Salva no banco
    try {
      const user = await this.prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          password: hashedPassword,
        },
      });
      console.log(`✅ [Auth] Usuário salvo com sucesso! ID: ${user.id}`);
      
      const { password, ...result } = user;
      return result;
    } catch (error) {
      console.error(`❌ [Auth] Erro ao salvar no Prisma:`, error);
      throw error;
    }
  }

  // --- LOGIN ---
  async login(data: { email: string; password: string }) {
    console.log(`\n--- [Auth] Iniciando Login: ${data.email} ---`);
    
    const user = await this.prisma.user.findUnique({ where: { email: data.email } });
    
    if (!user) {
      console.log(`❌ [Auth] Usuário não encontrado no banco.`);
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }

    const isMatch = await bcrypt.compare(data.password, user.password);
    
    if (!isMatch) {
      console.log(`❌ [Auth] Senha incorreta.`);
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }

    console.log(`✅ [Auth] Login autorizado.`);
    const { password, ...result } = user;
    return result;
  }
}