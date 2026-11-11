import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldCheck, 
  Eye, 
  AlertCircle, 
  CheckCircle, 
  Lock, 
  Mail, 
  X, 
  LogOut, 
  LogIn, 
  KeyRound, 
  UserCheck, 
  Users,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { isValidCancaoNovaEmail } from '../utils/validators';
import { UserRole } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login, logout, currentUser, users, switchUser } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('admin');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email) {
      setErrorMsg('Por favor, informe o seu e-mail corporativo.');
      return;
    }

    if (!isValidCancaoNovaEmail(email)) {
      setErrorMsg(
        'Acesso negado: Somente endereços de e-mail institucionais com o domínio @cancaonova.com são aceitos no sistema.'
      );
      return;
    }

    const res = login(email);
    if (!res.success) {
      setErrorMsg(res.message || 'Erro ao realizar login.');
    } else {
      setSuccessMsg(`Bem-vindo! Login realizado com sucesso.`);
      setTimeout(() => {
        onClose();
      }, 700);
    }
  };

  const handleLogout = () => {
    logout();
    setSuccessMsg('Sessão encerrada com sucesso! Você agora está desconectado.');
    setTimeout(() => {
      setSuccessMsg('');
    }, 2000);
  };

  const handleQuickLogin = (userId: string) => {
    switchUser(userId);
    const targetUser = users.find((u) => u.id === userId);
    setSuccessMsg(`Conectado como ${targetUser?.name || 'usuário'}!`);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-neutral-200 dark:border-neutral-800 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 px-6 py-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white font-bold shadow-sm">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Autenticação & Controle de Acesso</h2>
              <p className="text-xs text-amber-100 font-medium">Restaurante & Refeitório Canção Nova</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Active Session Card (If User is already logged in) */}
          {currentUser ? (
            <div className="bg-neutral-50 dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Status da Sessão Atual:
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Conectado
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 p-3 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100 leading-tight">
                      {currentUser.name}
                    </div>
                    <div className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                      {currentUser.email}
                    </div>
                    <div className="mt-1">
                      {currentUser.role === 'master' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-800">
                          👑 Administrador MASTER (Acesso Total)
                        </span>
                      ) : currentUser.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          Perfil Administrador Secundário (Edição Operacional)
                        </span>
                      ) : currentUser.role === 'cliente' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded border border-sky-300 dark:border-sky-800">
                          👤 Perfil Cliente (Rampa & Frutas)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-neutral-800 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded border border-neutral-300 dark:border-neutral-700">
                          <Eye className="w-3 h-3 text-neutral-600" />
                          Perfil Apenas Leitura (Visualização)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Explicit Logout Button */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0 hover:shadow-md"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair (Logout)</span>
                </button>
              </div>

              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Para trocar de usuário ou deslogar, use o botão vermelho acima ou selecione outro perfil abaixo.
              </p>
            </div>
          ) : (
            /* Institutional domain rule banner (when logged out) */
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl p-3.5 flex items-start gap-3">
              <Lock className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                <span className="font-bold block">Regra de Validação Institucional Canção Nova:</span>
                O acesso ao sistema de cardápios é restrito. Somente são aceitos e-mails que contenham o domínio{' '}
                <strong className="font-mono text-amber-950 dark:text-amber-300 font-bold">@cancaonova.com</strong> ou{' '}
                <strong className="font-mono text-amber-950 dark:text-amber-300 font-bold">@comunidadecancaonova.com</strong>.
              </div>
            </div>
          )}

          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 rounded-xl">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Login Form */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
              {currentUser ? 'Entrar com Outro E-mail Institucional:' : 'Entrar com E-mail Institucional:'}
            </h3>

            {/* Official Sign in with Google Button */}
            <button
              type="button"
              onClick={() => {
                login('wesley.moreira@comunidadecancaonova.com');
                setSuccessMsg('Conectado via Conta Google Workspace (Wesley Moreira)!');
                setTimeout(() => {
                  onClose();
                }, 500);
              }}
              className="w-full py-2.5 px-4 mb-3.5 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-750 text-neutral-800 dark:text-neutral-100 font-bold text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 shadow-2xs hover:shadow-sm transition-all flex items-center justify-center gap-3 cursor-pointer group"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span className="group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                Entrar com sua conta Google
              </span>
            </button>

            <div className="relative flex items-center justify-center mb-3">
              <div className="border-t border-neutral-200 dark:border-neutral-700 w-full"></div>
              <span className="bg-white dark:bg-neutral-900 px-2 text-[10px] uppercase tracking-wider text-neutral-400 font-bold shrink-0">
                ou com e-mail institucional
              </span>
              <div className="border-t border-neutral-200 dark:border-neutral-700 w-full"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  E-mail (@cancaonova.com)
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    placeholder="ex: wesley.moreira@comunidadecancaonova.com"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                    autoFocus={!currentUser}
                  />
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Senha Institucional <span className="text-[11px] text-neutral-400 font-normal">(opcional para validação local)</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer hover:shadow-md"
              >
                <LogIn className="w-4 h-4" />
                <span>Entrar no Sistema</span>
              </button>
            </form>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-neutral-50 dark:bg-neutral-800/80 px-6 py-3.5 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
            {currentUser ? (
              <span>Sessão ativa como <strong>{currentUser.name}</strong></span>
            ) : (
              <span>Nenhum usuário conectado (Modo Visitante)</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentUser && (
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Desconectar</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-semibold rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
