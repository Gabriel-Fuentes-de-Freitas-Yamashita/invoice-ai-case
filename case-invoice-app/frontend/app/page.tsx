'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Upload, FileText, ArrowRight, Loader2, Trash2, LogOut, User as UserIcon, Lock, Mail, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner'; // <--- Importar Toast

export default function Home() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loadingAuthRequest, setLoadingAuthRequest] = useState(false);
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');

  const [documents, setDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const storedEmail = localStorage.getItem('invoice_app_user_email');
    const storedName = localStorage.getItem('invoice_app_user_name');
    
    if (storedEmail) {
      setUserEmail(storedEmail);
      setUserName(storedName);
    }
    setAuthLoading(false);
  }, []);

  useEffect(() => {
    if (userEmail) {
      loadDocuments();
    }
  }, [userEmail]);

  const loadDocuments = async () => {
    try {
      const res = await api.get('/documents', {
        params: { email: userEmail }
      });
      setDocuments(res.data);
    } catch (error) {
      console.error('Erro ao buscar docs', error);
      // Feedback silencioso ou toast de erro discreto
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAuthRequest(true);
    
    try {
      let response;
      if (isRegistering) {
        response = await api.post('/auth/register', {
          email: emailInput,
          password: passwordInput,
          name: nameInput
        });
        toast.success("Conta criada com sucesso! Bem-vindo."); // <--- Feedback
      } else {
        response = await api.post('/auth/login', {
          email: emailInput,
          password: passwordInput
        });
        toast.success("Login efetuado com sucesso."); // <--- Feedback
      }

      const user = response.data;
      localStorage.setItem('invoice_app_user_email', user.email);
      localStorage.setItem('invoice_app_user_name', user.name || user.email);
      setUserEmail(user.email);
      setUserName(user.name || user.email);
      
      setEmailInput('');
      setPasswordInput('');
      setNameInput('');

    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || 'Erro na autenticação.';
      toast.error(msg); // <--- Feedback de Erro
    } finally {
      setLoadingAuthRequest(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('invoice_app_user_email');
    localStorage.removeItem('invoice_app_user_name');
    setUserEmail(null);
    setUserName(null);
    setDocuments([]);
    toast.info("Sessão terminada.");
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    if (!userEmail) return;
    
    setUploading(true);
    // Feedback de progresso
    const loadingToast = toast.loading("A processar documento e OCR...");

    const formData = new FormData();
    formData.append('file', e.target.files[0]);
    formData.append('userId', userEmail); 

    try {
      await api.post('/documents/upload', formData);
      await loadDocuments(); 
      toast.dismiss(loadingToast); // Remove o loading
      toast.success("Documento processado com sucesso!");
    } catch (error: any) {
      toast.dismiss(loadingToast);
      const msg = error.response?.data?.message || 'Erro no upload';
      toast.error(`Falha: ${msg}`);
    } finally {
      setUploading(false);
      // Limpa o input para permitir subir o mesmo arquivo se quiser
      e.target.value = '';
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault(); 
    // Usamos o confirm nativo aqui pois é uma ação destrutiva rápida, 
    // mas poderíamos usar um Modal customizado.
    if (!confirm('Tem certeza que deseja excluir este documento?')) return;

    setDeletingId(id);
    try {
      await api.delete(`/documents/${id}`);
      setDocuments(prev => prev.filter(doc => doc.id !== id));
      toast.success("Documento excluído.");
    } catch (error) {
      toast.error('Erro ao excluir documento.');
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500"><Loader2 className="animate-spin" /></div>;

  // ... (O resto do JSX mantém-se igual, apenas trocámos a lógica dos alerts)
  // Vou retornar o JSX completo para garantir que funciona ao copiar/colar
  
  if (!userEmail) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl transition-all">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-600/20 p-4 rounded-full ring-1 ring-blue-500/50">
              {isRegistering ? <UserPlus className="w-8 h-8 text-blue-500" /> : <UserIcon className="w-8 h-8 text-blue-500" />}
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white text-center mb-2">
            {isRegistering ? 'Crie sua conta' : 'Bem-vindo de volta'}
          </h1>
          <p className="text-slate-400 text-center mb-8 text-sm">
            {isRegistering ? 'Preencha seus dados para começar a usar o Invoice AI.' : 'Entre com suas credenciais para acessar seus documentos.'}
          </p>
          
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {isRegistering && (
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide">Nome Completo</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                  <input 
                    type="text" 
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Ex: João Silva"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder:text-slate-600"
                    required={isRegistering}
                  />
                </div>
              </div>
            )}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                <input 
                  type="email" 
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder:text-slate-600"
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                <input 
                  type="password" 
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder:text-slate-600"
                  required
                />
              </div>
            </div>
            <button 
              type="submit"
              disabled={loadingAuthRequest}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-6 shadow-lg shadow-blue-900/20 disabled:opacity-50"
            >
              {loadingAuthRequest ? <Loader2 className="animate-spin" /> : (isRegistering ? 'Cadastrar' : 'Entrar')} 
              {!loadingAuthRequest && <ArrowRight size={18} />}
            </button>
          </form>
          <div className="mt-6 pt-6 border-t border-slate-800 text-center">
            <p className="text-slate-400 text-sm">
              {isRegistering ? 'Já tem uma conta?' : 'Ainda não tem conta?'}
              <button 
                onClick={() => setIsRegistering(!isRegistering)}
                className="ml-2 text-blue-400 hover:text-blue-300 font-semibold hover:underline transition-all"
              >
                {isRegistering ? 'Fazer Login' : 'Criar Cadastro'}
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 border-b border-slate-800 pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Meus Documentos</h1>
            <div className="flex items-center gap-3 text-slate-400 bg-slate-900/50 px-4 py-2 rounded-lg border border-slate-800/50">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                {userName?.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Olá, {userName}</span>
                <span className="text-xs text-slate-400">{userEmail}</span>
              </div>
              <div className="h-8 w-px bg-slate-800 mx-2"></div>
              <button onClick={handleLogout} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 hover:bg-red-950/30 px-2 py-1 rounded transition-colors">
                <LogOut size={14} />
              </button>
            </div>
          </div>
          <label className={`flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-500 transition-all font-semibold shadow-lg shadow-blue-900/20 active:scale-95 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {uploading ? <Loader2 className="animate-spin w-5 h-5"/> : <Upload className="w-5 h-5"/>}
            {uploading ? 'Processando...' : 'Novo Upload'}
            <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} accept="image/*" />
          </label>
        </div>
        <div className="grid gap-4">
          {documents.map((doc) => (
            <Link href={`/documents/${doc.id}`} key={doc.id}>
              <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800 transition-all flex items-center justify-between group shadow-md relative">
                <div className="flex items-center gap-5 overflow-hidden">
                  <div className="bg-slate-800 p-4 rounded-lg text-blue-400 group-hover:text-blue-300 group-hover:bg-blue-900/20 transition-colors shrink-0">
                    <FileText size={24} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-lg text-slate-100 group-hover:text-blue-300 transition-colors truncate">{doc.title}</h3>
                    <p className="text-slate-400 text-sm mt-1">{new Date(doc.createdAt).toLocaleDateString()} • {doc._count?.messages || 0} mensagens</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={(e) => handleDelete(e, doc.id)} disabled={deletingId === doc.id} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-950/30 rounded-full transition-colors z-10">
                    {deletingId === doc.id ? <Loader2 className="animate-spin w-5 h-5"/> : <Trash2 size={20} />}
                  </button>
                  <div className="bg-slate-800 p-2 rounded-full text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all"><ArrowRight size={20} /></div>
                </div>
              </div>
            </Link>
          ))}
          {documents.length === 0 && !uploading && (
            <label className="block text-center py-24 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed cursor-pointer hover:bg-slate-900 hover:border-blue-500/50 transition-all group relative">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-900/20 transition-colors"><Upload className="text-slate-500 w-8 h-8 group-hover:text-blue-400 transition-colors" /></div>
              <h3 className="text-xl font-medium text-slate-300 mb-2 group-hover:text-blue-300 transition-colors">Sua lista está vazia</h3>
              <p className="text-slate-500 group-hover:text-slate-400">Clique aqui para fazer o upload da sua primeira fatura.</p>
              <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} accept="image/*" />
            </label>
          )}
        </div>
      </div>
    </div>
  );
}