# 🧾 Invoice AI — Analisador de Documentos Inteligente

Solução Full Stack que utiliza Inteligência Artificial para extrair dados de documentos (OCR) e permitir que os utilizadores conversem com o conteúdo extraído via Chat Interativo.

---

## 📸 Visão Geral do Projeto

### 1. Autenticação Segura
Sistema completo de registo e login com proteção de rotas.  
**(Coloque aqui o print do ecrã de login)**

### 2. Dashboard Intuitivo
Gira os seus documentos com uma interface limpa e Dark Mode.  
**(Coloque aqui o print da Home)**

### 3. Análise Inteligente (OCR + IA)
Visualize a fatura original, o texto extraído e use a IA para tirar dúvidas.  
**(Coloque aqui o print do ecrã dividido: Imagem vs Chat)**

---

## 🚀 Funcionalidades

- 🔐 **Autenticação Real:** Sistema de Login e Registo com palavras-passe encriptadas (Bcrypt).
- 📄 **Upload & OCR:** Extração de texto a partir de imagens de faturas utilizando Tesseract.js.
- 🤖 **IA Generativa:** Integração com Groq Cloud (LLaMA 3) para interpretar dados e responder perguntas como:
  - “Qual o valor total?”
  - “Qual a data de vencimento?”
- 🛡️ **Privacidade:** Cada utilizador vê apenas os seus próprios documentos.
- 📥 **Exportação:** Geração de relatórios completos (.txt) com OCR + histórico do chat.
- 🎨 **UX/UI Moderna:** Interface responsiva com Tailwind CSS, dark mode, loaders e toasts.

---

## 🛠️ Tecnologias Utilizadas

### **Backend (API)**
- NestJS  
- Prisma ORM  
- PostgreSQL (Docker)  
- Groq SDK  
- Bcrypt  

### **Frontend (Web)**
- Next.js 14 (App Router)  
- Tailwind CSS  
- Lucide React  
- Axios  

---

## ⚙️ Como Rodar o Projeto Localmente

### **Pré-requisitos**
- Node.js (v18+)
- Docker & Docker Compose
- Chave de API da Groq Cloud (gratuita)

---

### **Passo 1 — Base de Dados**

Na raiz do projeto:

```bash
docker-compose up -d
```

### **Passo 2 — Backend**
```bash
cd backend
npm install
```

Prepare a base:
```bash
npx prisma generate
npx prisma db push
```
Crie o arquivo .env:
```bash
DATABASE_URL="postgresql://admin:password123@localhost:5432/invoice_db?schema=public"
GROQ_API_KEY="gsk_sua_chave_aqui..."
```
Inicie:
```bash
npm run start:dev
```

Backend disponível em: http://localhost:3000

### **Passo 3 — Frontend**
```bash
cd frontend
npm install
npm run dev
```

Frontend disponível em: http://localhost:3001