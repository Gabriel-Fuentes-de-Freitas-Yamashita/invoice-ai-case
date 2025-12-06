  import type { Metadata } from "next";
  import { Inter } from "next/font/google";
  import "./globals.css";
  import { Toaster } from "sonner";
  import React from 'react';

  const inter = Inter({ subsets: ["latin"] });

  export const metadata: Metadata = {
    title: "Invoice AI",
    description: "Análise inteligente de documentos",
  };

  export default function RootLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    return (
      <html lang="pt">
        <body className={inter.className}>
          {children}
          {/* O componente Toaster fica aqui para estar disponível em toda a app */}
          <Toaster richColors position="top-right" theme="dark" />
        </body>
      </html>
    );
  }