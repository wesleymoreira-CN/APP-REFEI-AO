import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Utensils, 
  Lock, 
  Mail, 
  KeyRound, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  LogIn, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ChefHat, 
  Scale, 
  Tag, 
  Calendar,
  LogOut,
  UserCheck,
  ShieldAlert
} from 'lucide-react';
import { isValidCancaoNovaEmail } from '../utils/validators';

interface LoginPageProps {
  onLoginSuccess?: () => void;
  onContinueAsGuest?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ 
  onLoginSuccess,
  onContinueAsGuest 
}) => {
  const { login, logout, currentUser, users, switchUser } = useApp();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim()) {
      setErrorMsg('Por favor, digite o seu endereço de e-mail corporativo.');
      return;
    }

    if (!isValidCancaoNovaEmail(email)) {
      setErrorMsg(
        'Acesso restrito: Somente e-mails corporativos válidos (@cancaonova.com ou @comunidadecancaonova.com) são autorizados.'
      );
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const res = login(email);
      setIsSubmitting(false);

      if (!res.success) {
        setErrorMsg(res.message || 'Erro ao realizar login.');
      } else {
        setSuccessMsg('Autenticação autorizada! Redirecionando para o cardápio...');
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess();
          }
        }, 600);
      }
    }, 400);
  };

  const handleQuickLogin = (userId: string) => {
    switchUser(userId);
    const targetUser = users.find((u) => u.id === userId);
    setSuccessMsg(`Conectado com sucesso como ${targetUser?.name || 'usuário'}!`);
    setTimeout(() => {
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    }, 500);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-3 sm:p-6 lg:p-8 animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden grid grid-cols-1 lg:grid-cols-12 transition-colors">
        
        {/* Left Side: Brand Hero & Institutional Details (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-amber-700 via-amber-800 to-neutral-900 text-white p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle background photo overlay */}
          <div className="absolute inset-0 opacity-15 mix-blend-overlay pointer-events-none">
            <img
              src="/src/assets/images/buffet_dishes_banner_1793386733368.jpg"
              alt="Buffet Canção Nova"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="relative z-10 space-y-6">
            {/* Header / Brand Wordmark */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-black shadow-inner">
                <Utensils className="w-6 h-6 text-amber-200" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-white leading-tight uppercase">
                  CardápioPro
                </h1>
                <p className="text-xs font-semibold text-amber-200 tracking-wider uppercase">
                  Restaurante Canção Nova
                </p>
              </div>
            </div>

            {/* Intro text */}
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                Planejamento & Gestão Nutricional
              </h2>
              <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed">
                Plataforma oficial de montagem dos cardápios semanais (Rampa e Kilo), controle de repetições com intervalo mínimo de 2 semanas e emissão de etiquetas sanitárias RDC 216.
              </p>
            </div>

            {/* Feature Highlights Strip */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-2.5 text-xs text-amber-50">
                <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <ChefHat className="w-3.5 h-3.5 text-amber-300" />
                </div>
                <span>Montagem flexível com múltiplos itens por categoria</span>
              </div>

              <div className="flex items-center gap-2.5 text-xs text-amber-50">
                <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                </div>
                <span>Prevenção inteligente de repetições (mín. 2 semanas)</span>
              </div>

              <div className="flex items-center gap-2.5 text-xs text-amber-50">
                <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <Scale className="w-3.5 h-3.5 text-amber-300" />
                </div>
                <span>Ordens de produção com pesos, porções e comensais</span>
              </div>

              <div className="flex items-center gap-2.5 text-xs text-amber-50">
                <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <Tag className="w-3.5 h-3.5 text-amber-300" />
                </div>
                <span>Etiquetas térmicas e termos de coleta de amostras RDC 216</span>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="relative z-10 pt-8 mt-6 border-t border-white/15 text-[11px] text-amber-200/80 flex items-center justify-between">
            <span>Fundação João Paulo II</span>
            <span className="font-mono text-white font-semibold">@cancaonova.com</span>
          </div>
        </div>

        {/* Right Side: Login Form / Active Session (7 cols) */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between">
          
          {/* Active Session Status (If already logged in) */}
          {currentUser ? (
            <div className="space-y-6 my-auto">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-full text-xs font-bold border border-emerald-300 dark:border-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Sessão Autenticada Ativa</span>
                </div>
                <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight">
                  Bem-vindo, {currentUser.name}!
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Você já está conectado ao sistema do Restaurante Canção Nova.
                </p>
              </div>

              {/* User Profile Card */}
              <div className="bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center text-lg font-black shadow-sm">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
                      {currentUser.name}
                    </h3>
                    <p className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                      {currentUser.email}
                    </p>
                    <div className="mt-1">
                      {currentUser.role === 'master' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/80 px-2.5 py-0.5 rounded-md border border-amber-300 dark:border-amber-800">
                          👑 Perfil Administrador MASTER (Wesley Moreira - Acesso Total)
                        </span>
                      ) : currentUser.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-800">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          Perfil Administrador Secundário (Edição Operacional)
                        </span>
                      ) : currentUser.role === 'cliente' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-800 dark:text-sky-300 bg-sky-100/80 dark:bg-sky-950/80 px-2.5 py-0.5 rounded-md border border-sky-300 dark:border-sky-800">
                          👤 Perfil Cliente (Acesso Exclusivo: Cardápio Rampa & Pedido de Frutas)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-800 dark:text-neutral-300 bg-neutral-100/80 dark:bg-neutral-800 px-2.5 py-0.5 rounded-md border border-neutral-300 dark:border-neutral-700">
                          <Eye className="w-3.5 h-3.5 text-neutral-600" />
                          Perfil Apenas Leitura (Visualização do Cardápio)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t border-neutral-200 dark:border-neutral-700 pt-3 text-xs text-neutral-600 dark:text-neutral-300 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Setor / Departamento:</span>
                    <strong className="text-neutral-800 dark:text-neutral-200">{currentUser.department || 'Nutrição e Refeitório'}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Nível de Permissão:</span>
                    <strong className={
                      currentUser.role === 'master'
                        ? 'text-amber-600 font-bold'
                        : currentUser.role === 'admin' 
                        ? 'text-emerald-600 font-bold' 
                        : currentUser.role === 'cliente'
                        ? 'text-sky-600 font-bold'
                        : 'text-neutral-500'
                    }>
                      {currentUser.role === 'master' 
                        ? '👑 Controle Geral (Master)' 
                        : currentUser.role === 'admin' 
                        ? '✓ Edição Total Liberada' 
                        : currentUser.role === 'cliente'
                        ? '👤 Área Exclusiva de Pedidos Rampa & Frutas'
                        : 'Bloqueada (Somente Leitura)'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Logged In User */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onLoginSuccess}
                  className="w-full sm:flex-1 py-3 px-5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer hover:shadow-md"
                >
                  <span>{currentUser.role === 'cliente' ? 'Acessar Cardápio da Rampa & Frutas' : 'Ir para o Cardápio Semanal'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setSuccessMsg('Sessão encerrada com sucesso! Você agora está desconectado.');
                    setTimeout(() => setSuccessMsg(''), 2000);
                  }}
                  className="w-full sm:w-auto py-3 px-5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-600" />
                  <span>Sair da Conta (Logout)</span>
                </button>
              </div>
            </div>
          ) : (
            /* Login Form (When disconnected) */
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
                  Acessar CardápioPro
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Entre com seu e-mail corporativo institucional para ter acesso à montagem dos cardápios.
                </p>
              </div>

              {/* Institutional Domain Banner */}
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl p-3.5 flex items-start gap-3">
                <Lock className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                  <span className="font-bold block">Acesso Restrito Canção Nova:</span>
                  Somente são autorizados e-mails contendo o domínio{' '}
                  <strong className="font-mono text-amber-950 dark:text-amber-300 font-bold">@cancaonova.com</strong> ou{' '}
                  <strong className="font-mono text-amber-950 dark:text-amber-300 font-bold">@comunidadecancaonova.com</strong>.
                </div>
              </div>

              {/* Feedback messages */}
              {errorMsg && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 rounded-xl animate-in fade-in duration-100">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2.5 rounded-xl animate-in fade-in duration-100">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Official Sign in with Google Button */}
              <button
                type="button"
                onClick={() => {
                  login('wesley.moreira@comunidadecancaonova.com');
                  setSuccessMsg('Conectado via Conta Google Workspace (Wesley Moreira - MASTER)!');
                  setTimeout(() => {
                    if (onLoginSuccess) onLoginSuccess();
                  }, 500);
                }}
                className="w-full py-3 px-4 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-750 text-neutral-800 dark:text-neutral-100 font-bold text-xs sm:text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 shadow-2xs hover:shadow-sm transition-all flex items-center justify-center gap-3 cursor-pointer group"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span className="group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                  Entrar com Conta Google (Wesley Moreira - MASTER)
                </span>
              </button>

              {/* Quick Profile Selectors (Master, Admin Secundário, Cliente) */}
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Acesso Rápido por Perfil do Sistema:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Master Button */}
                  <button
                    type="button"
                    onClick={() => {
                      login('wesley.moreira@comunidadecancaonova.com');
                      setSuccessMsg('Conectado como Administrador MASTER!');
                      setTimeout(() => { if (onLoginSuccess) onLoginSuccess(); }, 400);
                    }}
                    className="p-2.5 rounded-xl border-2 border-amber-400 dark:border-amber-700 bg-amber-50/70 dark:bg-amber-950/40 text-left hover:bg-amber-100 transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-sm">👑</span>
                      <strong className="text-xs text-amber-950 dark:text-amber-200">Admin MASTER</strong>
                    </div>
                    <p className="text-[10px] text-amber-800 dark:text-amber-300 font-medium truncate">Wesley Moreira</p>
                    <span className="text-[9px] text-amber-700/80 dark:text-amber-400 block font-mono truncate">@comunidadecancaonova.com</span>
                  </button>

                  {/* Admin Secundário Button */}
                  <button
                    type="button"
                    onClick={() => {
                      login('maria.silva@cancaonova.com');
                      setSuccessMsg('Conectado como Administrador Secundário!');
                      setTimeout(() => { if (onLoginSuccess) onLoginSuccess(); }, 400);
                    }}
                    className="p-2.5 rounded-xl border-2 border-emerald-400 dark:border-emerald-750 bg-emerald-50/70 dark:bg-emerald-950/40 text-left hover:bg-emerald-100 transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <strong className="text-xs text-emerald-950 dark:text-emerald-200">Admin Secundário</strong>
                    </div>
                    <p className="text-[10px] text-emerald-800 dark:text-emerald-300 font-medium truncate">Maria Cecília</p>
                    <span className="text-[9px] text-emerald-700/80 dark:text-emerald-400 block font-mono truncate">Nutrição & Cardápios</span>
                  </button>

                  {/* Cliente Button */}
                  <button
                    type="button"
                    onClick={() => {
                      login('eventos.retiros@cancaonova.com');
                      setSuccessMsg('Conectado como Cliente (Rampa & Frutas)!');
                      setTimeout(() => { if (onLoginSuccess) onLoginSuccess(); }, 400);
                    }}
                    className="p-2.5 rounded-xl border-2 border-sky-400 dark:border-sky-750 bg-sky-50/70 dark:bg-sky-950/40 text-left hover:bg-sky-100 transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-sm">👤</span>
                      <strong className="text-xs text-sky-950 dark:text-sky-200">Cliente (Rampa)</strong>
                    </div>
                    <p className="text-[10px] text-sky-800 dark:text-sky-300 font-medium truncate">Lucas Ferreira</p>
                    <span className="text-[9px] text-sky-700/80 dark:text-sky-400 block font-mono truncate">Exclusivo: Rampa & Frutas</span>
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-3">
                <div className="border-t border-neutral-200 dark:border-neutral-700/80 w-full"></div>
                <span className="bg-white dark:bg-neutral-900 px-3 text-[10px] uppercase tracking-wider text-neutral-400 font-bold shrink-0">
                  ou acesse com e-mail corporativo
                </span>
                <div className="border-t border-neutral-200 dark:border-neutral-700/80 w-full"></div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    E-mail Institucional (@cancaonova.com)
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
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono shadow-2xs"
                      autoFocus
                    />
                    <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      Senha Corporativa
                    </label>
                    <span className="text-[11px] text-neutral-400">
                      (validação simplificada de demonstração)
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-2.5 text-xs bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono shadow-2xs"
                    />
                    <KeyRound className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-0.5 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-neutral-600 dark:text-neutral-400">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-neutral-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span>Lembrar meu e-mail neste navegador</span>
                  </label>

                  <span className="text-neutral-400 font-mono text-[11px]">
                    SSL Seguro
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer hover:shadow-md"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isSubmitting ? 'Validando Acesso...' : 'Entrar no Sistema'}</span>
                </button>
              </form>

              {/* Guest / Visitor Access Link */}
              {onContinueAsGuest && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={onContinueAsGuest}
                    className="text-xs text-neutral-500 hover:text-amber-700 dark:text-neutral-400 dark:hover:text-amber-400 font-semibold underline underline-offset-4 cursor-pointer transition-colors"
                  >
                    Ou continuar como visitante (Visualizar cardápio em modo apenas leitura) &rarr;
                  </button>
                </div>
              )}
            </div>
          )}



        </div>

      </div>
    </div>
  );
};
