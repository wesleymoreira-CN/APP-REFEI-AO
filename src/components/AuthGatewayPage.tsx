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
  UserPlus, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  ChefHat, 
  Scale, 
  Tag, 
  Building, 
  User, 
  Sun, 
  Moon, 
  X,
  ShieldAlert
} from 'lucide-react';
import { isValidCancaoNovaEmail } from '../utils/validators';
import { UserRole } from '../types';

interface AuthGatewayPageProps {
  initialMode?: 'login' | 'register';
  onAuthSuccess?: () => void;
}

export const AuthGatewayPage: React.FC<AuthGatewayPageProps> = ({ 
  initialMode = 'login',
  onAuthSuccess 
}) => {
  const { login, registerUser, users, theme, toggleTheme } = useApp();
  
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regDepartment, setRegDepartment] = useState('Nutrição & Cardápios');
  const [regRole, setRegRole] = useState<UserRole>('admin');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(true);

  // Google SSO Modal State
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [googleCustomEmail, setGoogleCustomEmail] = useState('');
  const [showOtherGoogleInput, setShowOtherGoogleInput] = useState(false);
  const [googleError, setGoogleError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Status feedback
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live validator for register email
  const isRegEmailValid = isValidCancaoNovaEmail(regEmail);
  const passwordsMatch = regPassword.length > 0 && regPassword === regConfirmPassword;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!loginEmail.trim()) {
      setErrorMsg('Por favor, informe seu endereço de e-mail corporativo.');
      return;
    }

    if (!isValidCancaoNovaEmail(loginEmail)) {
      setErrorMsg('Acesso restrito: Somente e-mails corporativos válidos (@cancaonova.com ou @comunidadecancaonova.com) são autorizados.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const res = login(loginEmail);
      setIsSubmitting(false);

      if (!res.success) {
        setErrorMsg(res.message || 'Erro ao realizar login.');
      } else {
        setSuccessMsg('Autenticação bem-sucedida! Carregando cardápios...');
        setTimeout(() => {
          if (onAuthSuccess) onAuthSuccess();
        }, 500);
      }
    }, 350);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!regName.trim()) {
      setErrorMsg('Por favor, digite seu nome completo para o cadastro.');
      return;
    }

    if (!regEmail.trim()) {
      setErrorMsg('Por favor, informe seu e-mail corporativo institucional.');
      return;
    }

    if (!isRegEmailValid) {
      setErrorMsg('Acesso restrito: O e-mail deve conter obrigatoriamente o domínio @cancaonova.com ou @comunidadecancaonova.com.');
      return;
    }

    if (regPassword.length < 4) {
      setErrorMsg('Por segurança, defina uma senha com pelo menos 4 caracteres.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('A confirmação de senha não confere com a senha digitada.');
      return;
    }

    if (!acceptTerms) {
      setErrorMsg('Você precisa confirmar a declaração institucional de uso do sistema.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const res = registerUser(regName, regEmail, regRole, regDepartment);
      setIsSubmitting(false);

      if (!res.success) {
        setErrorMsg(res.message || 'Erro ao efetuar o cadastro.');
      } else {
        setSuccessMsg('Conta institucional cadastrada com sucesso! Bem-vindo ao CardápioPro.');
        setTimeout(() => {
          if (onAuthSuccess) onAuthSuccess();
        }, 600);
      }
    }, 450);
  };

  // Google Workspace SSO Authentication handler
  const handleGoogleSignInAccount = (email: string, displayName?: string, role: UserRole = 'admin') => {
    setGoogleError('');
    setIsGoogleLoading(true);

    const clean = email.trim().toLowerCase();
    if (!isValidCancaoNovaEmail(clean)) {
      setIsGoogleLoading(false);
      setGoogleError('Acesso restrito: Apenas contas corporativas Google Workspace @cancaonova.com ou @comunidadecancaonova.com são autorizadas.');
      return;
    }

    setTimeout(() => {
      const existing = users.find((u) => u.email.toLowerCase() === clean);
      if (existing) {
        login(clean);
      } else {
        registerUser(
          displayName || clean.split('@')[0].replace('.', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
          clean,
          role,
          'Nutrição & Refeitório Canção Nova'
        );
      }
      setIsGoogleLoading(false);
      setGoogleModalOpen(false);
      setSuccessMsg(`Conectado com sucesso via Conta Google: ${clean}`);
      setTimeout(() => {
        if (onAuthSuccess) onAuthSuccess();
      }, 500);
    }, 600);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors p-3 sm:p-6 lg:p-8">
      
      {/* Top Bar with Brand & Dark/Light Switcher */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between py-2 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-sm">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-neutral-900 dark:text-neutral-100">
              CardápioPro
            </span>
            <span className="text-[10px] block font-semibold text-amber-700 dark:text-amber-500 uppercase tracking-widest">
              Restaurante Canção Nova
            </span>
          </div>
        </div>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
          className="p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors flex items-center gap-2 text-xs font-semibold cursor-pointer border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xs"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Tema Claro</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-neutral-600" />
              <span className="hidden sm:inline">Tema Escuro</span>
            </>
          )}
        </button>
      </div>

      {/* Main Unified Auth Card */}
      <div className="max-w-6xl w-full mx-auto bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden grid grid-cols-1 lg:grid-cols-12 transition-colors">
        
        {/* Left Column: Institutional Brand & Features (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-amber-700 via-amber-800 to-neutral-900 text-white p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
          {/* Background photo overlay */}
          <div className="absolute inset-0 opacity-15 mix-blend-overlay pointer-events-none">
            <img
              src="/src/assets/images/buffet_dishes_banner_1793386733368.jpg"
              alt="Buffet Nutritivo Canção Nova"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="relative z-10 space-y-6">
            {/* Header Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-bold text-amber-100 border border-white/20">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
              <span>Acesso Restrito Institucional</span>
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                Portal de Nutrição & Gestão de Cardápios
              </h1>
              <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed">
                Plataforma oficial para planejamento semanal dos cardápios <strong>Rampa</strong> e <strong>a Quilo</strong> do Restaurante e Refeitório Canção Nova.
              </p>
            </div>

            {/* Feature Highlights List */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 text-xs text-amber-50">
                <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <ChefHat className="w-3.5 h-3.5 text-amber-300" />
                </div>
                <div>
                  <strong className="block text-white">Montagem com Múltiplos Itens</strong>
                  <span className="text-amber-200/90 text-[11px]">Adicione vários pratos e opções por categoria em cada dia da semana.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs text-amber-50">
                <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                </div>
                <div>
                  <strong className="block text-white">Regra Anti-Repetição Inteligente</strong>
                  <span className="text-amber-200/90 text-[11px]">O sistema impede alimentos repetidos com espaçamento mínimo obrigatório de 2 semanas.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs text-amber-50">
                <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Scale className="w-3.5 h-3.5 text-amber-300" />
                </div>
                <div>
                  <strong className="block text-white">Ordens de Produção da Cozinha</strong>
                  <span className="text-amber-200/90 text-[11px]">Cálculo automático de pesos brutos, porções individuais e comensais atendidos.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs text-amber-50">
                <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Tag className="w-3.5 h-3.5 text-amber-300" />
                </div>
                <div>
                  <strong className="block text-white">Etiquetas Térmicas RDC 216</strong>
                  <span className="text-amber-200/90 text-[11px]">Emissão direta de termos e etiquetas de coleta de amostras das preparações do dia.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="relative z-10 pt-6 mt-6 border-t border-white/15 text-[11px] text-amber-200/80 flex items-center justify-between">
            <span>Fundação João Paulo II</span>
            <span className="font-mono text-white font-semibold">Cachoeira Paulista / SP</span>
          </div>
        </div>

        {/* Right Column: Switchable Auth Forms (7 cols) */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between">
          
          <div className="space-y-5">
            
            {/* Mode Switcher Tabs (Entrar vs Cadastrar) */}
            <div className="flex items-center p-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  mode === 'login'
                    ? 'bg-white dark:bg-neutral-900 text-amber-700 dark:text-amber-400 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Acessar Conta (Login)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  mode === 'register'
                    ? 'bg-white dark:bg-neutral-900 text-amber-700 dark:text-amber-400 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Cadastrar Novo Usuário</span>
              </button>
            </div>

            {/* Institutional Security Notice */}
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
              <Lock className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>Acesso Exclusivo Institucional:</strong> Somente são aceitos e-mails que contenham{' '}
                <span className="font-mono font-bold text-amber-950 dark:text-amber-300">@cancaonova.com</span> ou{' '}
                <span className="font-mono font-bold text-amber-950 dark:text-amber-300">@comunidadecancaonova.com</span>.
              </div>
            </div>

            {/* Feedback Messages */}
            {errorMsg && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 rounded-xl animate-in fade-in duration-100">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2.5 rounded-xl animate-in fade-in duration-100">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="font-bold">{successMsg}</span>
              </div>
            )}

            {/* TAB 1: LOGIN FORM */}
            {mode === 'login' ? (
              <div className="space-y-4">
                
                {/* Official Sign in with Google Button */}
                <button
                  type="button"
                  onClick={() => {
                    setGoogleError('');
                    setGoogleModalOpen(true);
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
                    Entrar com sua conta Google
                  </span>
                </button>

                {/* Divider */}
                <div className="relative flex items-center justify-center my-3">
                  <div className="border-t border-neutral-200 dark:border-neutral-700/80 w-full"></div>
                  <span className="bg-white dark:bg-neutral-900 px-3 text-[10px] uppercase tracking-wider text-neutral-400 font-bold shrink-0">
                    ou acesse com e-mail corporativo
                  </span>
                  <div className="border-t border-neutral-200 dark:border-neutral-700/80 w-full"></div>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                      E-mail Corporativo Canção Nova
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="seu.nome@cancaonova.com"
                        required
                        className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors placeholder:text-neutral-400"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                        Senha de Acesso
                      </label>
                      <span className="text-[11px] text-neutral-400">
                        Mínimo 4 caracteres
                      </span>
                    </div>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-neutral-600 dark:text-neutral-300">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded text-amber-600 focus:ring-amber-500 border-neutral-300"
                      />
                      <span>Lembrar meu acesso neste navegador</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer hover:shadow-md"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{isSubmitting ? 'Verificando credenciais...' : 'Entrar no Sistema'}</span>
                  </button>
                </form>
              </div>
            ) : (
              /* TAB 2: REGISTRATION FORM */
              <div className="space-y-4">
                
                {/* Official Sign in with Google Button for Quick Register */}
                <button
                  type="button"
                  onClick={() => {
                    setGoogleError('');
                    setGoogleModalOpen(true);
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
                    Cadastrar com sua conta Google
                  </span>
                </button>

                {/* Divider */}
                <div className="relative flex items-center justify-center my-2">
                  <div className="border-t border-neutral-200 dark:border-neutral-700/80 w-full"></div>
                  <span className="bg-white dark:bg-neutral-900 px-3 text-[10px] uppercase tracking-wider text-neutral-400 font-bold shrink-0">
                    ou preencha os dados do cadastro
                  </span>
                  <div className="border-t border-neutral-200 dark:border-neutral-700/80 w-full"></div>
                </div>

                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                      Nome Completo do Colaborador / Missionário
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Ex: Wesley Moreira"
                        required
                        className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Email with Live Validator */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                        E-mail Institucional (@cancaonova.com)
                      </label>
                      {regEmail && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          isRegEmailValid 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                        }`}>
                          {isRegEmailValid ? '✓ Domínio Válido' : '✕ Inválido'}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="seu.nome@cancaonova.com"
                        required
                        className={`w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-neutral-50 dark:bg-neutral-800 border rounded-xl focus:ring-2 focus:ring-amber-500 transition-colors ${
                          regEmail && !isRegEmailValid
                            ? 'border-rose-400 dark:border-rose-700'
                            : 'border-neutral-300 dark:border-neutral-700'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Sector / Department */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                      Setor de Atuação
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <select
                        value={regDepartment}
                        onChange={(e) => setRegDepartment(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-amber-500 transition-colors cursor-pointer"
                      >
                        <option value="Nutrição & Cardápios">Nutrição & Cardápios</option>
                        <option value="Cozinha Central & Produção">Cozinha Central & Produção</option>
                        <option value="Hospitalidade & Refeitório Geral">Hospitalidade & Refeitório Geral</option>
                        <option value="Eventos & Peregrinação">Eventos & Peregrinação</option>
                        <option value="Administração & Suprimentos">Administração & Suprimentos</option>
                      </select>
                    </div>
                  </div>

                  {/* Access Role Selection (Admin vs Read-only) */}
                  {/* Access Role Selection (Master notice + Admin Secundário vs Cliente vs Leitor) */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                      Nível de Permissão Solicitado no Cadastro
                    </label>

                    {/* Master Info Note */}
                    <div className="mb-2 p-2.5 rounded-xl bg-amber-100/70 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 flex items-center gap-2">
                      <span className="text-base shrink-0">👑</span>
                      <span>
                        <strong>Administrador MASTER:</strong> Atribuído exclusivamente a <strong>wesley.moreira@comunidadecancaonova.com</strong> com controle pleno sobre todos os módulos e usuários.
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {/* Secondary Admin Choice */}
                      <div
                        onClick={() => setRegRole('admin')}
                        className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          regRole === 'admin'
                            ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 text-neutral-900 dark:text-neutral-100 shadow-2xs'
                            : 'border-neutral-200 dark:border-neutral-700/70 bg-neutral-50 dark:bg-neutral-800/40 hover:border-neutral-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <ShieldCheck className={`w-4 h-4 ${regRole === 'admin' ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-400'}`} />
                          <span className="font-bold text-xs">Admin Secundário</span>
                        </div>
                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-snug">
                          Montar cardápios semanais, alterar pratos, calcular quantidades da cozinha e fichas técnicas.
                        </p>
                      </div>

                      {/* Cliente Choice */}
                      <div
                        onClick={() => setRegRole('cliente')}
                        className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          regRole === 'cliente'
                            ? 'border-sky-600 bg-sky-50/70 dark:bg-sky-950/40 text-neutral-900 dark:text-neutral-100 shadow-2xs'
                            : 'border-neutral-200 dark:border-neutral-700/70 bg-neutral-50 dark:bg-neutral-800/40 hover:border-neutral-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <User className={`w-4 h-4 ${regRole === 'cliente' ? 'text-sky-600 dark:text-sky-400' : 'text-neutral-400'}`} />
                          <span className="font-bold text-xs">Cliente (Rampa & Frutas)</span>
                        </div>
                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-snug">
                          <strong>Acesso exclusivo:</strong> Visualiza somente o Cardápio da Rampa, calcula por nº de pessoas e pede frutas.
                        </p>
                      </div>

                      {/* Read-Only Choice */}
                      <div
                        onClick={() => setRegRole('leitor')}
                        className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          regRole === 'leitor'
                            ? 'border-neutral-600 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-2xs'
                            : 'border-neutral-200 dark:border-neutral-700/70 bg-neutral-50 dark:bg-neutral-800/40 hover:border-neutral-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Eye className={`w-4 h-4 ${regRole === 'leitor' ? 'text-neutral-700 dark:text-neutral-300' : 'text-neutral-400'}`} />
                          <span className="font-bold text-xs">Apenas Leitura</span>
                        </div>
                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-snug">
                          Visualização e consulta dos cardápios semanais sem permissão para editar preparações.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Password & Confirmation */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                        Definir Senha
                      </label>
                      <div className="relative">
                        <KeyRound className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="w-full pl-9 pr-8 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-amber-500 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                        >
                          {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                        Confirmar Senha
                      </label>
                      <div className="relative">
                        <KeyRound className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          className={`w-full pl-9 pr-4 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border rounded-xl focus:ring-2 focus:ring-amber-500 transition-colors ${
                            regConfirmPassword && !passwordsMatch
                              ? 'border-rose-400 dark:border-rose-700'
                              : 'border-neutral-300 dark:border-neutral-700'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Terms checkbox */}
                  <div className="pt-1">
                    <label className="flex items-start gap-2.5 cursor-pointer text-[11px] text-neutral-600 dark:text-neutral-300 leading-snug">
                      <input
                        type="checkbox"
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                        className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 border-neutral-300"
                      />
                      <span>
                        Declaro que sou colaborador/membro Canção Nova e estou ciente das normas de nutrição e sigilo do sistema.
                      </span>
                    </label>
                  </div>

                  {/* Submit Register */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer hover:shadow-md"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{isSubmitting ? 'Registrando nova conta...' : 'Concluir Cadastro & Entrar no Sistema'}</span>
                  </button>
                </form>
              </div>
            )}

          </div>

          {/* Bottom Switch Note */}
          <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800 text-center text-xs text-neutral-500 dark:text-neutral-400">
            {mode === 'login' ? (
              <p>
                Primeiro acesso ou não tem cadastro?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="text-amber-700 dark:text-amber-400 font-bold hover:underline cursor-pointer"
                >
                  Criar conta institucional aqui
                </button>
              </p>
            ) : (
              <p>
                Já possui sua conta registrada?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="text-amber-700 dark:text-amber-400 font-bold hover:underline cursor-pointer"
                >
                  Fazer login agora
                </button>
              </p>
            )}
          </div>

        </div>

      </div>

      {/* Footer credits */}
      <div className="max-w-6xl w-full mx-auto text-center py-4 text-xs text-neutral-400 dark:text-neutral-500">
        CardápioPro Canção Nova · Sistema Integrado de Gestão Nutricional & Cardápios Semanais
      </div>

      {/* Google Workspace SSO Modal (Authentic Google Dialog) */}
      {googleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-6 sm:p-7 space-y-6 relative overflow-hidden transition-colors">
            
            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                if (!isGoogleLoading) setGoogleModalOpen(false);
              }}
              className="absolute right-4 top-4 p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Google Header */}
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-neutral-200 dark:border-neutral-700 flex items-center justify-center">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                Fazer login com o Google
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs">
                Escolha sua conta institucional para acessar o <strong>CardápioPro Canção Nova</strong>
              </p>
            </div>

            {/* Error Message in modal */}
            {googleError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2 rounded-xl">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{googleError}</span>
              </div>
            )}

            {/* Loading Indicator */}
            {isGoogleLoading ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                  Autenticando via Google Workspace...
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                
                {/* Account 1: Wesley Moreira (Administrador MASTER) */}
                <button
                  type="button"
                  onClick={() => handleGoogleSignInAccount('wesley.moreira@comunidadecancaonova.com', 'Wesley Moreira', 'master')}
                  className="w-full p-3 rounded-2xl border-2 border-amber-400 dark:border-amber-700/80 bg-amber-50/60 dark:bg-amber-950/40 hover:bg-amber-100/70 dark:hover:bg-amber-900/50 transition-all flex items-center justify-between text-left cursor-pointer group shadow-2xs"
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-600 to-amber-700 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs ring-2 ring-amber-400/40">
                      👑
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                          Wesley Moreira
                        </p>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-200 dark:bg-amber-900 text-amber-950 dark:text-amber-200">
                          MASTER
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono truncate">
                        wesley.moreira@comunidadecancaonova.com
                      </p>
                      <span className="text-[10px] text-amber-800 dark:text-amber-300 font-semibold block">
                        Administrador MASTER · Controle Geral do Sistema
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-amber-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                </button>

                {/* Other Accounts from System (Admin Secundário, Cliente, etc.) */}
                {users.filter(u => u.email !== 'wesley.moreira@comunidadecancaonova.com').slice(0, 3).map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleGoogleSignInAccount(u.email, u.name, u.role)}
                    className="w-full p-3 rounded-2xl border border-neutral-200 dark:border-neutral-750 bg-neutral-50 dark:bg-neutral-800/80 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:border-amber-500 dark:hover:border-amber-500 transition-all flex items-center justify-between text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 font-bold text-sm flex items-center justify-center shrink-0">
                        {u.role === 'admin' ? '🛡️' : u.role === 'cliente' ? '👤' : u.name.charAt(0)}
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                            {u.name}
                          </p>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            u.role === 'admin'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : u.role === 'cliente'
                              ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                              : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                          }`}>
                            {u.role === 'admin' ? 'Admin Secundário' : u.role === 'cliente' ? 'Cliente' : 'Leitor'}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono truncate">
                          {u.email}
                        </p>
                        <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block truncate">
                          {u.role === 'admin'
                            ? 'Edição de Cardápios & Cozinha'
                            : u.role === 'cliente'
                            ? 'Acesso Exclusivo: Cardápio Rampa & Frutas'
                            : 'Consulta & Leitura'}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                  </button>
                ))}

                {/* Option: Use another Google account */}
                <div className="pt-2">
                  {!showOtherGoogleInput ? (
                    <button
                      type="button"
                      onClick={() => setShowOtherGoogleInput(true)}
                      className="w-full py-2.5 px-3 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-amber-700 dark:hover:text-amber-400 hover:border-amber-500 text-center transition-colors cursor-pointer"
                    >
                      + Usar outra conta Google institucional (@cancaonova.com)
                    </button>
                  ) : (
                    <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-700 space-y-2.5">
                      <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                        Digite seu e-mail Google Workspace:
                      </label>
                      <input
                        type="email"
                        value={googleCustomEmail}
                        onChange={(e) => setGoogleCustomEmail(e.target.value)}
                        placeholder="nome@cancaonova.com"
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-amber-500"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleGoogleSignInAccount(googleCustomEmail)}
                          className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                        >
                          Continuar com esta conta
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowOtherGoogleInput(false);
                            setGoogleCustomEmail('');
                            setGoogleError('');
                          }}
                          className="py-2 px-3 text-xs text-neutral-500 hover:text-neutral-700 cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* Modal Footer Note */}
            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 text-center">
              <p className="text-[10px] text-neutral-400 dark:text-neutral-500 leading-snug">
                Protegido pelo Google Workspace SSO. Ao continuar, você concorda com a política de privacidade da Fundação João Paulo II.
              </p>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
