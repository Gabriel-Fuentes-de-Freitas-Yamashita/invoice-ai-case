'use client';

import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import { 
  Send, Bot, User, ArrowLeft, Image as ImageIcon, MessageSquare, 
  Loader2, FileText, Download, Copy, Sparkles 
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { toast } from 'sonner'; // <--- Importar Toast

export default function DocumentDetail() {
  const { id } = useParams();
  const [doc, setDoc] = useState<any>(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    "Resuma este documento",
    "Qual o valor total?",
    "Quem é o fornecedor?",
    "Quais os itens listados?",
    "Qual a data de vencimento?"
  ];

  useEffect(() => {
    if (id) {
      api.get(`/documents/${id}`).then(res => {
        setDoc(res.data);
        setMessages(res.data.messages || []);
      }).catch(err => toast.error("Erro ao carregar documento."));
    }
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg = text;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await api.post(`/documents/${id}/chat`, { message: userMsg });
      setMessages(prev => [...prev, res.data]);
    } catch (error) {
      toast.error('Erro ao comunicar com a IA.');
    } finally {
      setLoading(false);
    }
  };

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  const handleCopyText = () => {
    if (doc?.ocrText) {
      navigator.clipboard.writeText(doc.ocrText);
      toast.success("Texto copiado para a área de transferência!"); // <--- Feedback bonito
    }
  };

  const handleDownload = () => {
    if (!doc) return;

    const fileContent = `
RELATÓRIO DE ANÁLISE - INVOICE AI
=================================
Documento: ${doc.title}
ID: ${doc.id}
Data de Processamento: ${new Date(doc.createdAt).toLocaleString()}

---------------------------------
TEXTO EXTRAÍDO (OCR)
---------------------------------
${doc.ocrText}

---------------------------------
HISTÓRICO DE CHAT COM IA
---------------------------------
${messages.map((m: any) => `[${m.role === 'user' ? 'USUÁRIO' : 'IA'} - ${new Date(m.createdAt).toLocaleTimeString()}]:\n${m.content}`).join('\n\n')}
    `.trim();

    const element = document.createElement("a");
    const file = new Blob([fileContent], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${doc.title.split('.')[0]}_relatorio.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Download iniciado!");
  };

  if (!doc) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Carregando interface...</div>;

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-200">
      {/* Header */}
      <header className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="font-bold text-lg text-white truncate max-w-md">{doc.title}</h1>
            <span className="text-xs text-slate-500 font-mono uppercase">{doc.id.slice(0, 8)}...</span>
          </div>
        </div>

        <button 
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors border border-slate-700 font-medium text-sm"
          title="Baixar relatório completo"
        >
          <Download size={16} />
          <span className="hidden sm:inline">Baixar Relatório</span>
        </button>
      </header>

      {/* Resto do Layout igual ... */}
      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/2 flex flex-col border-r border-slate-800 bg-slate-925">
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3 text-blue-400 font-semibold text-sm uppercase tracking-wider">
                <ImageIcon size={16} />
                Visualização
              </div>
              <div className="bg-slate-900 p-2 rounded-xl border border-slate-800 shadow-inner">
                <img src={`http://localhost:3000/documents/file/${doc.filename}`} alt="Documento" className="w-full rounded-lg opacity-90 hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-green-400 font-semibold text-sm uppercase tracking-wider">
                  <FileText size={16} />
                  Texto Extraído (OCR)
                </div>
                <button onClick={handleCopyText} className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-md transition-all" title="Copiar texto">
                  <Copy size={14} />
                </button>
              </div>
              <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 font-mono text-sm text-slate-300 leading-relaxed whitespace-pre-wrap shadow-inner selection:bg-green-900 selection:text-green-100">
                {doc.ocrText}
              </div>
            </div>
          </div>
        </div>

        <div className="w-1/2 flex flex-col bg-slate-950">
          <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center gap-2 text-slate-400 text-sm">
            <MessageSquare size={16} />
            <span>Chat Inteligente</span>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-60">
                <Bot size={48} className="mb-4 text-slate-600" />
                <p>O que você quer saber sobre este documento?</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-4 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && (
                  <div className="w-8 h-8 bg-green-900/30 rounded-lg flex items-center justify-center border border-green-800 shrink-0"><Bot size={16} className="text-green-400"/></div>
                )}
                <div className={`p-4 rounded-2xl max-w-[85%] leading-relaxed shadow-md ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'}`}>
                  {m.content}
                </div>
                {m.role === 'user' && (
                  <div className="w-8 h-8 bg-blue-900/30 rounded-lg flex items-center justify-center border border-blue-800 shrink-0"><User size={16} className="text-blue-400"/></div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-green-900/30 rounded-lg flex items-center justify-center border border-green-800"><Loader2 size={16} className="text-green-400 animate-spin"/></div>
                <div className="bg-slate-800 p-4 rounded-2xl rounded-tl-none border border-slate-700 text-slate-400 text-sm animate-pulse">Analisando documento...</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="bg-slate-900 border-t border-slate-800 p-4">
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
              {quickPrompts.map((prompt, idx) => (
                <button key={idx} onClick={() => handleSendMessage(prompt)} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-blue-500/50 rounded-full text-xs text-slate-300 hover:text-white whitespace-nowrap transition-all disabled:opacity-50">
                  <Sparkles size={12} className="text-blue-400" />
                  {prompt}
                </button>
              ))}
            </div>
            <form onSubmit={onFormSubmit} className="flex gap-3">
              <input value={input} onChange={e => setInput(e.target.value)} className="flex-1 bg-slate-800 border border-slate-700 text-slate-100 rounded-xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-500 transition-all" placeholder="Ex: Qual o valor total da nota?" disabled={loading} />
              <button type="submit" disabled={loading || !input.trim()} className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors shadow-lg shadow-blue-900/20"><Send size={20} /></button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}