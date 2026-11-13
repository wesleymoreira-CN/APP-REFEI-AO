import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Utensils, 
  Printer, 
  ShieldCheck, 
  Eye, 
  LogOut, 
  LogIn,
  Key,
  ChevronDown,
  ChefHat,
  Sun,
  Moon,
  FileSpreadsheet,
  Apple,
  Crown,
  User as UserIcon
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'menu' | 'production' | 'recipes' | 'samples' | 'spreadsheet' | 'dishBank' | 'users' | 'conflicts' | 'monthView' | 'clientPortal' | 'login';
  setActiveTab: (tab: 'menu' | 'production' | 'recipes' | 'samples' | 'spreadsheet' | 'dishBank' | 'users' | 'conflicts' | 'monthView' | 'clientPortal' | 'login') => void;
  onOpenPrint: () => void;
  onOpenLogin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenPrint,
  onOpenLogin,
}) => {
  const { currentUser, users, switchUser, logout, conflicts, theme, toggleTheme } = useApp();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 transition-colors w-full max-w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        
        {/* ROW 1: Brand Identity (Left) + Actions & User Account (Right) */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-2.5">
          
          {/* Zone 1: Brand title wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-amber-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100 whitespace-nowrap block leading-tight">
                CardápioPro
              </span>
              <span className="text-[11px] font-medium text-amber-700 dark:text-amber-500 uppercase tracking-wider block whitespace-nowrap">
                Restaurante Canção Nova
              </span>
            </div>
          </div>

          {/* Zone 3: Actions, Theme Toggle & Current User */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0 ml-auto">
            {/* Theme Toggle (Light / Dark) */}
            <button
              type="button"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
              className="p-2 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-neutral-700" />
              )}
            </button>

            {/* Print button (Hidden for clients) */}
            {currentUser?.role !== 'cliente' && (
              <button
                type="button"
                onClick={onOpenPrint}
                title="Visualizar e imprimir cardápio para mural"
                className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Imprimir Mural</span>
              </button>
            )}

            {/* User Profile or Login */}
            {currentUser ? (
              <div className="flex items-center gap-2 shrink-0">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-left cursor-pointer border border-neutral-200 dark:border-neutral-700"
                  >
                    <div className="w-7 h-7 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {currentUser.name.charAt(0)}
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 leading-tight truncate max-w-[130px]">
                        {currentUser.name.split(' ')[0]}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                        {currentUser.role === 'master' ? (
                          <span className="text-amber-600 dark:text-amber-400 font-extrabold flex items-center gap-0.5">
                            <Crown className="w-3 h-3 inline text-amber-500" /> Admin MASTER
                          </span>
                        ) : currentUser.role === 'admin' ? (
                          <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                            <ShieldCheck className="w-3 h-3 inline" /> Admin Secundário
                          </span>
                        ) : currentUser.role === 'cliente' ? (
                          <span className="text-sky-700 dark:text-sky-400 font-bold flex items-center gap-0.5">
                            <UserIcon className="w-3 h-3 inline" /> Cliente
                          </span>
                        ) : (
                          <span className="text-neutral-600 dark:text-neutral-400 font-bold flex items-center gap-0.5">
                            <Eye className="w-3 h-3 inline" /> Leitor
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-3 py-2 border-b border-neutral-100 dark:border-neutral-800">
                        <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">{currentUser.name}</p>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono truncate">{currentUser.email}</p>
                        <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded ${
                          currentUser.role === 'master'
                            ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800'
                            : currentUser.role === 'admin'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : currentUser.role === 'cliente'
                            ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700'
                        }`}>
                          {currentUser.role === 'master' 
                            ? '👑 Administrador MASTER (Wesley)' 
                            : currentUser.role === 'admin' 
                            ? '🛡️ Administrador Secundário' 
                            : currentUser.role === 'cliente'
                            ? '👤 Cliente (Apenas Cardápio Rampa & Frutas)'
                            : '👁️ Perfil Leitor (Apenas Visualização)'}
                        </span>
                      </div>

                      {(currentUser.role === 'master' || currentUser.role === 'admin') && (
                        <div className="py-1 max-h-56 overflow-y-auto custom-scrollbar-y">
                          <p className="px-3 py-1 text-[10px] uppercase font-bold text-neutral-400 dark:text-neutral-500 tracking-wider">
                            Alternar Usuário:
                          </p>
                          {users.map((u) => (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => {
                                switchUser(u.id);
                                setUserDropdownOpen(false);
                              }}
                              className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer ${
                                u.id === currentUser.id 
                                  ? 'font-bold text-amber-700 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/30' 
                                  : 'text-neutral-700 dark:text-neutral-200'
                              }`}
                            >
                              <div className="truncate">
                                <p className="leading-tight truncate">{u.name}</p>
                                <p className="text-[10px] text-neutral-400 font-mono truncate">{u.email}</p>
                              </div>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ml-2 shrink-0 ${
                                u.role === 'master'
                                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                                  : u.role === 'admin'
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                                  : u.role === 'cliente'
                                  ? 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300'
                                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                              }`}>
                                {u.role === 'master' ? 'Master' : u.role === 'admin' ? 'Adm' : u.role === 'cliente' ? 'Cliente' : 'Leitor'}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="pt-1 border-t border-neutral-100 dark:border-neutral-800 space-y-1">
                        <button
                          type="button"
                          onClick={() => {
                            onOpenLogin();
                            setUserDropdownOpen(false);
                          }}
                          className="w-full px-3 py-1.5 text-left text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-2 cursor-pointer font-medium"
                        >
                          <Key className="w-3.5 h-3.5 text-amber-600" />
                          <span>Gerenciar Sessão & Login</span>
                        </button>

                        {(currentUser.role === 'master' || currentUser.role === 'admin') && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab('users');
                              setUserDropdownOpen(false);
                            }}
                            className="w-full px-3 py-1.5 text-left text-xs text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 flex items-center gap-2 cursor-pointer font-medium"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Banco de Dados & Apps Script</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            logout();
                            setUserDropdownOpen(false);
                            setActiveTab('login');
                          }}
                          className="w-full px-3 py-1.5 text-left text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 cursor-pointer font-bold"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sair (Logout)</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Direct Visible Logout Button */}
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setUserDropdownOpen(false);
                    setActiveTab('login');
                  }}
                  title="Encerrar sessão imediatamente e ir para a página de login"
                  className="px-2.5 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900/80 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span className="hidden sm:inline">Sair (Logout)</span>
                </button>
              </div>
            ) : (
              /* Direct Visible Login Button */
              <button
                type="button"
                onClick={() => setActiveTab('login')}
                className="px-3.5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer hover:shadow-md whitespace-nowrap shrink-0"
              >
                <LogIn className="w-4 h-4" />
                <span>Página de Login</span>
              </button>
            )}
          </div>
        </div>

        {/* ROW 2: Stacked Navigation Links Below Header Bar with Visible Horizontal Scrollbar */}
        <nav
          aria-label="Navegação Principal"
          className="w-full border-t border-neutral-100 dark:border-neutral-800 py-2 overflow-x-auto custom-scrollbar-x"
        >
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-neutral-600 dark:text-neutral-300 min-w-max pb-1">
            {currentUser?.role === 'cliente' ? (
              /* CLIENT ONLY NAVIGATION: ONLY the single ordering tab is visible! */
              <button
                type="button"
                onClick={() => setActiveTab('clientPortal')}
                className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-extrabold border border-amber-300 dark:border-amber-800 cursor-pointer flex items-center gap-2 text-xs sm:text-sm whitespace-nowrap shrink-0"
              >
                <Apple className="w-4 h-4 text-rose-600" />
                <span>Fazer Pedido de Refeição (Rampa & Frutas)</span>
                <span className="bg-amber-200/70 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 text-[10px] font-bold px-2 py-0.5 rounded font-mono">
                  Área do Cliente
                </span>
              </button>
            ) : (
              /* ADMIN / MASTER / LEITOR NAVIGATION: Stacked cleanly below Row 1 with horizontal scroll */
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('menu')}
                  className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'menu'
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-800'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white border border-transparent'
                  }`}
                >
                  <span>Cardápio Semanal</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('spreadsheet')}
                  className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'spreadsheet'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white border border-transparent'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-bold">Tabela & Planilha</span>
                  <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-1.5 py-0.5 rounded font-mono">
                    Pedidos
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('production')}
                  className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'production'
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-800'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white border border-transparent'
                  }`}
                >
                  <span>Quantidades & Produção</span>
                  <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded">
                    Cozinha
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('recipes')}
                  className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'recipes'
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-800'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white border border-transparent'
                  }`}
                >
                  <ChefHat className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Receitas & Fichas Técnicas</span>
                  <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded font-mono">
                    FTP / Pax
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('clientPortal')}
                  className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'clientPortal'
                      ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-bold border border-rose-300 dark:border-rose-800'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white border border-transparent'
                  }`}
                >
                  <Apple className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span>Portal Rampa & Pedidos</span>
                  <span className="bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 text-[10px] font-bold px-1.5 py-0.5 rounded font-mono">
                    Clientes
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('samples')}
                  className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'samples'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white border border-transparent'
                  }`}
                >
                  <span>Etiquetas de Amostras</span>
                  <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-1.5 py-0.5 rounded">
                    RDC 216
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('monthView')}
                  className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTab === 'monthView'
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-800'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white border border-transparent'
                  }`}
                >
                  Visão Mensal
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('dishBank')}
                  className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTab === 'dishBank'
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-800'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white border border-transparent'
                  }`}
                >
                  Banco de Pratos
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('conflicts')}
                  className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'conflicts'
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-800'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white border border-transparent'
                  }`}
                >
                  <span>Detector Anti-Repetição</span>
                  {conflicts.length > 0 && (
                    <span className="bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 text-[11px] font-bold px-1.5 py-0.5 rounded-md tabular-nums">
                      {conflicts.length}
                    </span>
                  )}
                </button>

                {(currentUser?.role === 'master' || currentUser?.role === 'admin') && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('users')}
                    className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      activeTab === 'users'
                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-800'
                        : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white border border-transparent'
                    }`}
                  >
                    Usuários & Permissões
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  title="Abrir Página de Login e Gerenciamento de Sessão"
                  className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 text-xs ${
                    activeTab === 'login'
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-800'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border border-transparent'
                  }`}
                >
                  <Key className="w-3.5 h-3.5 text-amber-600" />
                  <span>{currentUser ? 'Login / Sessão' : 'Página de Login'}</span>
                </button>
              </>
            )}
          </div>
        </nav>

      </div>
    </header>
  );
};
