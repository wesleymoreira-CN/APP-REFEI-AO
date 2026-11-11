/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { MonthWeekSelector } from './components/MonthWeekSelector';
import { WeeklyMenuGrid } from './components/WeeklyMenuGrid';
import { LoginModal } from './components/LoginModal';
import { UserManagementModal } from './components/UserManagementModal';
import { DishBankModal } from './components/DishBankModal';
import { PrintableMenuView } from './components/PrintableMenuView';
import { MonthlyOverviewModal } from './components/MonthlyOverviewModal';
import { ConflictDetectorModal } from './components/ConflictDetectorModal';
import { DayOptionsModal } from './components/DayOptionsModal';
import { ProductionQuantitiesView } from './components/ProductionQuantitiesView';
import { SampleCollectionLabelsView } from './components/SampleCollectionLabelsView';
import { LoginPage } from './components/LoginPage';
import { AuthGatewayPage } from './components/AuthGatewayPage';
import { CentralSpreadsheetView } from './components/CentralSpreadsheetView';
import { DishRecipesView } from './components/DishRecipesView';
import { ClientRampaPortalView } from './components/ClientRampaPortalView';
import { MONTH_NAMES } from './utils/validators';
import { 
  ShieldCheck, 
  Eye, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw, 
  Download, 
  Upload,
  Sparkles,
  Info,
  Soup,
  Scale,
  Tag,
  LogIn,
  LogOut,
  Lock,
  FileSpreadsheet,
  Crown,
  User as UserIcon,
  ShoppingBag
} from 'lucide-react';

function MainLayout() {
  const {
    currentUser,
    logout,
    selectedYear,
    selectedMonth,
    selectedWeek,
    setSelectedWeek,
    currentMenu,
    conflicts,
    resetToDefault,
    exportJSON,
    importJSON,
    menuType,
    isMaster,
    isAdmin,
    isClient,
    canEdit,
  } = useApp();

  // Navigation tab state: 'menu' | 'production' | 'recipes' | 'samples' | 'spreadsheet' | 'clientPortal' | 'dishBank' | 'users' | 'conflicts' | 'monthView' | 'login'
  const [activeTab, setActiveTab] = useState<'menu' | 'production' | 'recipes' | 'samples' | 'spreadsheet' | 'clientPortal' | 'dishBank' | 'users' | 'conflicts' | 'monthView' | 'login'>(() => {
    if (currentUser?.role === 'cliente') {
      return 'clientPortal';
    }
    return 'menu';
  });
  const [sampleInitialDay, setSampleInitialDay] = useState<string | undefined>(undefined);

  // Strictly enforce client role restriction: clients MUST see only the client portal tab
  React.useEffect(() => {
    if (currentUser?.role === 'cliente' && activeTab !== 'clientPortal' && activeTab !== 'login') {
      setActiveTab('clientPortal');
    }
  }, [currentUser, activeTab]);

  // Modals state
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [dishBankModalOpen, setDishBankModalOpen] = useState(false);
  const [printViewOpen, setPrintViewOpen] = useState(false);
  const [monthModalOpen, setMonthModalOpen] = useState(false);
  const [conflictModalOpen, setConflictModalOpen] = useState(false);

  // Sync tab navigation with modals
  const handleTabChange = (tab: 'menu' | 'production' | 'recipes' | 'samples' | 'spreadsheet' | 'clientPortal' | 'dishBank' | 'users' | 'conflicts' | 'monthView' | 'login') => {
    if (currentUser?.role === 'cliente' && tab !== 'clientPortal' && tab !== 'login') {
      setActiveTab('clientPortal');
      return;
    }
    setActiveTab(tab);
    if (tab === 'dishBank') setDishBankModalOpen(true);
    if (tab === 'users') setUserModalOpen(true);
    if (tab === 'monthView') setMonthModalOpen(true);
    if (tab === 'conflicts') setConflictModalOpen(true);
  };

  const handleExport = () => {
    const dataStr = exportJSON();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cardapiopro-cancao-nova-${selectedYear}-${selectedMonth}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (re) => {
          const content = re.target?.result as string;
          if (content) {
            const ok = importJSON(content);
            if (ok) alert('Dados importados com sucesso!');
            else alert('Erro ao processar arquivo JSON.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // Strict Auth Gateway: User has zero access to cardápios or features before logging in or registering!
  if (!currentUser) {
    return <AuthGatewayPage onAuthSuccess={() => setActiveTab('menu')} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans transition-colors">
      {/* Top Navbar */}
      <div className="no-print">
        <Navbar
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          onOpenPrint={() => setPrintViewOpen(true)}
          onOpenLogin={() => setLoginModalOpen(true)}
        />
      </div>

      {/* Hero / Context Sub-Banner with Photography (Hidden for client users) */}
      {!isClient && (
        <div className="no-print bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              
              {/* Left Column: Context Info */}
              <div className="lg:col-span-8 space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Sistema de Gestão Nutricional
                  </span>
                  <span className="text-neutral-300 dark:text-neutral-600">·</span>
                  <span className="font-bold text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded">
                    {menuType === 'rampa' ? '🍲 Cardápio Rampa' : '⚖️ Cardápio a Quilo'}
                  </span>
                  <span className="text-neutral-300 dark:text-neutral-600">·</span>
                  <span className="font-semibold text-amber-700 dark:text-amber-400">
                    {MONTH_NAMES[selectedMonth - 1]} de {selectedYear}
                  </span>
                  <span className="text-neutral-300 dark:text-neutral-600">·</span>
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                    Semana {selectedWeek} ({currentMenu.startDate} a {currentMenu.endDate})
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight leading-tight">
                  Montagem de Cardápios Semanais
                </h1>

                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed max-w-2xl">
                  Planejamento manual e flexível para todos os meses do ano com múltiplos itens por categoria. 
                  O motor inteligente verifica automaticamente a <strong>regra de não-repetição</strong> entre semanas consecutivas,
                  garantindo variedade e equilíbrio nutricional aos colaboradores e peregrinos.
                </p>

                {/* Badges strip (Clean typography with separators) */}
                <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                  <div className="flex items-center gap-2 font-medium">
                    {currentUser ? (
                      currentUser.role === 'master' ? (
                        <>
                          <Crown className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                          <span className="text-neutral-700 dark:text-neutral-300">
                            Acesso: <strong>{currentUser.name} (👑 Administrador MASTER)</strong>
                          </span>
                          <button
                            onClick={() => {
                              logout();
                              setActiveTab('login');
                            }}
                            title="Sair do sistema (Logout)"
                            className="ml-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer flex items-center gap-0.5"
                          >
                            <LogOut className="w-3 h-3" />
                            <span>[Sair]</span>
                          </button>
                        </>
                      ) : currentUser.role === 'admin' ? (
                        <>
                          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-neutral-700 dark:text-neutral-300">
                            Acesso: <strong>{currentUser.name} (🛡️ Administrador Secundário)</strong>
                          </span>
                          <button
                            onClick={() => {
                              logout();
                              setActiveTab('login');
                            }}
                            title="Sair do sistema (Logout)"
                            className="ml-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer flex items-center gap-0.5"
                          >
                            <LogOut className="w-3 h-3" />
                            <span>[Sair]</span>
                          </button>
                        </>
                      ) : currentUser.role === 'cliente' ? (
                        <>
                          <UserIcon className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                          <span className="text-neutral-700 dark:text-neutral-300">
                            Acesso: <strong>{currentUser.name} (👤 Cliente)</strong>
                          </span>
                          <button
                            onClick={() => {
                              logout();
                              setActiveTab('login');
                            }}
                            title="Sair do sistema (Logout)"
                            className="ml-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer flex items-center gap-0.5"
                          >
                            <LogOut className="w-3 h-3" />
                            <span>[Sair]</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                          <span className="text-neutral-700 dark:text-neutral-300">
                            Acesso: <strong>{currentUser.name} (👁️ Apenas Leitura)</strong>
                          </span>
                          <button
                            onClick={() => {
                              logout();
                              setActiveTab('login');
                            }}
                            title="Sair do sistema (Logout)"
                            className="ml-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer flex items-center gap-0.5"
                          >
                            <LogOut className="w-3 h-3" />
                            <span>[Sair]</span>
                          </button>
                        </>
                      )
                    ) : (
                      <>
                        <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span className="text-neutral-700 dark:text-neutral-300">
                          Acesso: <strong>Modo Visitante (Desconectado)</strong>
                        </span>
                        <button
                          onClick={() => setActiveTab('login')}
                          className="ml-1 px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <LogIn className="w-3 h-3" />
                          <span>Fazer Login</span>
                        </button>
                      </>
                    )}
                  </div>

                  <span className="text-neutral-300 dark:text-neutral-600">·</span>

                  <div className="flex items-center gap-1.5 font-medium">
                    {conflicts.length === 0 ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                          Sem repetições consecutivas
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span className="text-amber-800 dark:text-amber-300 font-semibold">
                          {conflicts.length} {conflicts.length === 1 ? 'repetição detectada' : 'repetições detectadas'}
                        </span>
                      </>
                    )}
                  </div>

                  <span className="text-neutral-300 dark:text-neutral-600">·</span>

                  <div className="text-neutral-500 dark:text-neutral-400 font-mono text-[11px]">
                    E-mails restritos a: <strong>@cancaonova.com</strong>
                  </div>
                </div>
              </div>

              {/* Right Column: Hero Visual Asset */}
              <div className="lg:col-span-4 relative rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-xs h-36 sm:h-40 bg-neutral-100 dark:bg-neutral-800">
                <img
                  src="/src/assets/images/buffet_dishes_banner_1793386733368.jpg"
                  alt="Buffet nutritivo Canção Nova"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-neutral-950/30 to-transparent flex items-end p-3">
                  <p className="text-[11px] text-white font-medium drop-shadow-sm">
                    Restaurante Canção Nova · Nutrição & Hospitalidade
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Month & Week Navigation Bar (Hidden on login page and for client users) */}
      {activeTab !== 'login' && !isClient && (
        <div className="no-print">
          <MonthWeekSelector />
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5 print:p-0 print:m-0 print:max-w-none">
        
        {/* Logged Out / Visitor Notice Banner (Hidden when already on login page or for logged in users) */}
        {!currentUser && activeTab !== 'login' && (
          <div className="no-print bg-amber-50 dark:bg-amber-950/50 border-2 border-amber-300 dark:border-amber-700/60 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <LogIn className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                    Você está navegando desconectado (Modo Visitante)
                  </span>
                  <span className="text-[10px] font-bold bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded">
                    Somente Leitura
                  </span>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-0.5 leading-relaxed">
                  Faça login com seu e-mail corporativo <strong>@cancaonova.com</strong> para editar pratos, montar novos cardápios semanais ou aprovar fichas de produção da cozinha.
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('login')}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer shrink-0 hover:shadow"
            >
              <LogIn className="w-4 h-4" />
              <span>Fazer Login no Sistema</span>
            </button>
          </div>
        )}

        {/* View Switch: Client Portal vs Login Page vs Production Quantities vs Recipes vs Sample Labels vs Spreadsheet vs Menu Grid */}
        {activeTab === 'clientPortal' || isClient ? (
          <ClientRampaPortalView 
            onBackToMain={() => setActiveTab('menu')}
            onGoToSpreadsheet={() => setActiveTab('spreadsheet')}
          />
        ) : activeTab === 'login' ? (
          <LoginPage
            onLoginSuccess={() => setActiveTab(isClient ? 'clientPortal' : 'menu')}
            onContinueAsGuest={() => setActiveTab('menu')}
          />
        ) : activeTab === 'spreadsheet' ? (
          <CentralSpreadsheetView />
        ) : activeTab === 'recipes' ? (
          <DishRecipesView onBackToMenu={() => setActiveTab('menu')} />
        ) : activeTab === 'production' ? (
          <ProductionQuantitiesView onSwitchToMenuTab={() => setActiveTab('menu')} />
        ) : activeTab === 'samples' ? (
          <SampleCollectionLabelsView
            initialDayKey={sampleInitialDay}
            onBackToMenu={() => setActiveTab('menu')}
          />
        ) : (
          /* Weekly Menu Matrix Grid */
          <WeeklyMenuGrid
            onOpenDishBank={() => setDishBankModalOpen(true)}
            onOpenSamplesTab={() => setActiveTab('samples')}
            onOpenRecipesTab={() => setActiveTab('recipes')}
            onOpenSpreadsheet={() => setActiveTab('spreadsheet')}
            onOpenLogin={() => setActiveTab('login')}
          />
        )}

        {/* Secondary Info & Quick Utilities Bar */}
        <div className="no-print bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-neutral-600 dark:text-neutral-300 transition-colors">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-neutral-400 shrink-0" />
            <span>
              Suporte a <strong>múltiplos itens por categoria</strong> e alternância de <strong>tema claro e escuro</strong> ativa. 
              Acesso exclusivo para <strong>@cancaonova.com</strong>.
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExport}
              title="Baixar backup dos cardápios em JSON"
              className="px-2.5 py-1.5 text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar</span>
            </button>

            {isAdmin && (
              <button
                onClick={handleImport}
                title="Restaurar backup JSON"
                className="px-2.5 py-1.5 text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer font-medium"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Importar</span>
              </button>
            )}

            <button
              onClick={() => {
                if (confirm('Deseja restaurar todos os cardápios e usuários de demonstração?')) {
                  resetToDefault();
                }
              }}
              title="Restaurar dados originais de demonstração"
              className="px-2.5 py-1.5 text-neutral-500 dark:text-neutral-400 hover:text-amber-800 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-neutral-800 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Padrão</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="no-print bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 mt-auto py-5 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">CardápioPro</span>
            <span>·</span>
            <span>Restaurante & Refeitório Canção Nova</span>
            <span>·</span>
            <span className="font-mono text-[11px] text-amber-700 dark:text-amber-400 font-medium">@cancaonova.com</span>
          </div>
          <div className="text-neutral-400 dark:text-neutral-500 text-[11px]">
            Planejamento Semanal com Prevenção de Repetições Consecutivas
          </div>
        </div>
      </footer>

      {/* Modals */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
      />

      <UserManagementModal
        isOpen={userModalOpen}
        onClose={() => {
          setUserModalOpen(false);
          setActiveTab('menu');
        }}
        onOpenLoginModal={() => setLoginModalOpen(true)}
      />

      <DishBankModal
        isOpen={dishBankModalOpen}
        onClose={() => {
          setDishBankModalOpen(false);
          setActiveTab('menu');
        }}
      />

      <MonthlyOverviewModal
        isOpen={monthModalOpen}
        onClose={() => {
          setMonthModalOpen(false);
          setActiveTab('menu');
        }}
        onSelectWeek={(w) => setSelectedWeek(w)}
      />

      <ConflictDetectorModal
        isOpen={conflictModalOpen}
        onClose={() => {
          setConflictModalOpen(false);
          setActiveTab('menu');
        }}
      />

      {/* Day Options Modal when clicking any day */}
      <DayOptionsModal
        onOpenSampleLabels={(dKey) => {
          setSampleInitialDay(dKey);
          setActiveTab('samples');
        }}
        onOpenLogin={() => setLoginModalOpen(true)}
      />

      {printViewOpen && (
        <PrintableMenuView onClose={() => setPrintViewOpen(false)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
