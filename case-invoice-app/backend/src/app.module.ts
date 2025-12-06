import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DocumentsModule } from './documents/documents.module';
import { AuthModule } from './auth/auth.module'; // Importando o módulo de Auth

@Module({
  imports: [
    // Configuração Global (lê o .env)
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    
    // Nossos Módulos
    DocumentsModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}