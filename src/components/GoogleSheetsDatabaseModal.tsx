/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  getGoogleSheetsTemplateTsv,
  generateGoogleAppsScriptCode,
  validateAppsScriptEndpoint,
} from '../services/externalDatabaseService';
import { 
  FileSpreadsheet, 
  X, 
  Check, 
  Copy, 
  RefreshCw, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2,
  Users,
  Eye,
  EyeOff,
  Code2,
  Zap,
  Download,
  ArrowUpDown,
  Link2
} from 'lucide-react';

interface GoogleSheetsDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'apps_script' | 'code' | 'csv' | 'users';
}

export const GoogleSheetsDatabaseModal: React.FC<GoogleSheetsDatabaseModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'apps_script',
}) => {
  const { 
    users, 
    clientOrders,
    externalSheetUrl, 
    setExternalSheetUrl, 
    syncExternalDatabase, 
    isSyncingDatabase,
    lastDatabaseSync,
    appsScriptUrl,
    setAppsScriptUrl,
    autoSyncAppsScript,
    setAutoSyncAppsScript,
    lastAppsScriptSync,
    pullUsersFromAppsScript,
    syncAllWithAppsScript,
  } = useApp();

  const [activeModalTab, setActiveModalTab] = useState<'apps_script' | 'code' | 'csv' | 'users'>(initialTab);
  const [scriptUrlInput, setScriptUrlInput] = useState(appsScriptUrl || '');
  const [csvUrlInput, setCsvUrlInput] = useState(externalSheetUrl || '');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [copiedScriptCode, setCopiedScriptCode] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  if (!isOpen) return null;

  const appsScriptCode = generateGoogleAppsScriptCode();

  const handleSyncAppsScriptAll = async () => {
    setFeedbackMsg(null);
    const check = validateAppsScriptEndpoint(scriptUrlInput);
    if (!check.valid) {
      setFeedbackMsg({
        type: 'error',
        text: check.error || 'URL inválida. Cole a URL do App da Web terminada em /exec.',
      });
      return;
    }
    setAppsScriptUrl(check.cleanUrl);
    const res = await syncAllWithAppsScript(check.cleanUrl);
    setFeedbackMsg({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });
  };

  const handlePullUsersOnly = async () => {
    setFeedbackMsg(null);
    const check = validateAppsScriptEndpoint(scriptUrlInput);
    if (!check.valid) {
      setFeedbackMsg({
        type: 'error',
        text: check.error || 'Cole primeiro a URL /exec do seu Google Apps Script implantado.',
      });
      return;
    }
    setAppsScriptUrl(check.cleanUrl);
    const res = await pullUsersFromAppsScript(check.cleanUrl);
    setFeedbackMsg({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });
  };

  const handleSyncCsv = async () => {
    setFeedbackMsg(null);
    setExternalSheetUrl(csvUrlInput);
    const res = await syncExternalDatabase(csvUrlInput);
    if (res.success) {
      setFeedbackMsg({ type: 'success', text: res.message });
    } else {
      setFeedbackMsg({ type: 'error', text: res.message });
    }
  };

  const copyTextSafely = async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // Fallback for iframe clipboard restrictions
    }
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  };

  const handleCopyTemplate = async () => {
    const ok = await copyTextSafely(getGoogleSheetsTemplateTsv());
    if (ok) {
      setCopiedTemplate(true);
      setTimeout(() => setCopiedTemplate(false), 3000);
    } else {
      setFeedbackMsg({
        type: 'error',
        text: 'Não foi possível copiar automaticamente. Use Ctrl+A e Ctrl+C no conteúdo.',
      });
    }
  };

  const handleCopyScriptCode = async () => {
    const ok = await copyTextSafely(appsScriptCode);
    if (ok) {
      setCopiedScriptCode(true);
      setTimeout(() => setCopiedScriptCode(false), 3000);
    } else {
      setFeedbackMsg({
        type: 'error',
        text: 'Selecione o código abaixo (Ctrl+A) e copie manualmente (Ctrl+C), ou clique em "Baixar .gs".',
      });
    }
  };

  const handleDownloadScriptFile = () => {
    const blob = new Blob([appsScriptCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Code_CardapioPro_AppsScript.gs';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-4xl rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-4">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-900 text-white p-5 sm:p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-bold shadow-xs shrink-0">
              <FileSpreadsheet className="w-6 h-6 text-emerald-200" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                  Google Apps Script & Banco de Dados Google Sheets
                </h3>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-400 text-neutral-950 uppercase tracking-wider shrink-0">
                  Sincronização Real
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-0.5 truncate">
                Conecte sua planilha externa para ler logins/senhas e gravar pedidos, cardápios e produção automaticamente.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs Inside Modal (Scrollable) */}
        <div className="bg-neutral-50 dark:bg-neutral-950/60 border-b border-neutral-200 dark:border-neutral-800 px-4 sm:px-6 pt-2.5 flex items-center gap-2 overflow-x-auto custom-scrollbar-x">
          <button
            type="button"
            onClick={() => { setActiveModalTab('apps_script'); setFeedbackMsg(null); }}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-2 border-t border-l border-r transition-colors ${
              activeModalTab === 'apps_script'
                ? 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>1. Conectar Apps Script</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveModalTab('code'); setFeedbackMsg(null); }}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-2 border-t border-l border-r transition-colors ${
              activeModalTab === 'code'
                ? 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>2. Código Apps Script (Code.gs)</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveModalTab('csv'); setFeedbackMsg(null); }}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-2 border-t border-l border-r transition-colors ${
              activeModalTab === 'csv'
                ? 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>3. Link CSV (Somente Leitura)</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveModalTab('users'); setFeedbackMsg(null); }}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-2 border-t border-l border-r transition-colors ${
              activeModalTab === 'users'
                ? 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>4. Usuários no Banco ({users.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar-y">
          
          {feedbackMsg && (
            <div className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                : 'bg-rose-100 dark:bg-rose-950/70 text-rose-900 dark:text-rose-200 border border-rose-300 dark:border-rose-800'
            }`}>
              {feedbackMsg.type === 'success'
                ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
              <span className="leading-relaxed font-medium">{feedbackMsg.text}</span>
            </div>
          )}

          {/* TAB 1: GOOGLE APPS SCRIPT CONNECTION */}
          {activeModalTab === 'apps_script' && (
            <div className="space-y-5">
              {/* Summary of Sync Capabilities */}
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl p-4 text-xs space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-200">
                    <ArrowUpDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Sincronização Bidirecional via Google Apps Script</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveModalTab('code')}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] cursor-pointer flex items-center gap-1"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Ver / Copiar Código Code.gs</span>
                  </button>
                </div>
                <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  Ao conectar a URL do seu <strong>Google Apps Script Web App</strong>, sua planilha no Google Drive passa a atuar como banco de dados completo com 5 abas criadas automaticamente:{' '}
                  <span className="font-mono font-bold text-emerald-800 dark:text-emerald-300">Usuarios</span>,{' '}
                  <span className="font-mono font-bold text-emerald-800 dark:text-emerald-300">Pedidos_Rampa</span>,{' '}
                  <span className="font-mono font-bold text-emerald-800 dark:text-emerald-300">Cardapio_Semanal</span>,{' '}
                  <span className="font-mono font-bold text-emerald-800 dark:text-emerald-300">Producao_Cozinha</span> e{' '}
                  <span className="font-mono font-bold text-emerald-800 dark:text-emerald-300">Auditoria</span>.
                </p>
              </div>

              {/* URL Input & Action Buttons */}
              <div className="space-y-3 bg-neutral-50 dark:bg-neutral-800/60 p-4 sm:p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700">
                <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  URL do Web App do Google Apps Script (<span className="font-mono text-emerald-700 dark:text-emerald-400">.../exec</span>):
                </label>
                <input
                  type="url"
                  value={scriptUrlInput}
                  onChange={(e) => setScriptUrlInput(e.target.value)}
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs font-mono text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <label className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={autoSyncAppsScript}
                      onChange={(e) => setAutoSyncAppsScript(e.target.checked)}
                      className="rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Enviar automaticamente novos pedidos e usuários para a planilha</span>
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleSyncAppsScriptAll}
                    disabled={isSyncingDatabase}
                    className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncingDatabase ? 'animate-spin' : ''}`} />
                    <span>{isSyncingDatabase ? 'Sincronizando...' : 'Sincronizar Tudo Agora (Enviar Dados & Atualizar Usuários)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePullUsersOnly}
                    disabled={isSyncingDatabase}
                    className="px-4 py-2.5 bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0 disabled:opacity-50"
                  >
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>Ler Apenas Usuários (GET)</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between text-[11px] text-neutral-500 gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                  <span>
                    Base atual: <strong className="text-emerald-600 tabular-nums">{users.length} usuários</strong> · <strong className="text-amber-600 tabular-nums">{clientOrders.length} pedidos</strong>
                  </span>
                  {lastAppsScriptSync ? (
                    <span>Última sincronização Apps Script: <strong>{new Date(lastAppsScriptSync).toLocaleString('pt-BR')}</strong></span>
                  ) : (
                    <span>Nenhuma sincronização Apps Script executada ainda</span>
                  )}
                </div>
              </div>

              {/* Step-by-step Setup Guide */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                  Passo a Passo para Implantar o Apps Script no seu Google Sheets:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center">1</span>
                    <p className="font-bold text-neutral-900 dark:text-neutral-100">Abra sua Planilha</p>
                    <p className="text-[11px] text-neutral-500 leading-snug">
                      Crie uma planilha em <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-emerald-600 underline font-mono">sheets.new</a> no seu Google Drive e acesse o menu <strong>Extensões &gt; Apps Script</strong>.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center">2</span>
                    <p className="font-bold text-neutral-900 dark:text-neutral-100">Cole o Código Code.gs</p>
                    <p className="text-[11px] text-neutral-500 leading-snug">
                      Vá na aba <strong>2. Código Apps Script</strong> acima, copie todo o script, cole no editor do Google substituindo o conteúdo anterior e salve (Ctrl+S).
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center">3</span>
                    <p className="font-bold text-neutral-900 dark:text-neutral-100">Implante como Web App</p>
                    <p className="text-[11px] text-neutral-500 leading-snug">
                      Clique em <strong>Implantar &gt; Nova implantação &gt; App da Web</strong>. Configure <strong>Executar como: Eu</strong> e <strong>Quem pode acessar: Qualquer pessoa</strong>, depois autorize.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center">4</span>
                    <p className="font-bold text-neutral-900 dark:text-neutral-100">Conecte Aqui</p>
                    <p className="text-[11px] text-neutral-500 leading-snug">
                      Copie a URL gerada terminada em <span className="font-mono">/exec</span>, cole no campo acima e clique em <strong>Sincronizar Tudo Agora</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CODE.GS GENERATOR */}
          {activeModalTab === 'code' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    Código Oficial Google Apps Script (<span className="font-mono">Code.gs</span>)
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Cole este script em <strong>Extensões &gt; Apps Script</strong> dentro da sua planilha Google Sheets.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyScriptCode}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {copiedScriptCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedScriptCode ? 'Código Copiado!' : 'Copiar Código Completo'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadScriptFile}
                    className="px-3 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Baixar .gs</span>
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                <strong>Importante:</strong> No editor do Google Apps Script, selecione tudo que já existe em{' '}
                <span className="font-mono font-bold">Código.gs</span> (<span className="font-mono">Ctrl+A</span>), apague (<span className="font-mono">Delete</span>) e cole este código completo (<span className="font-mono">Ctrl+V</span>). Em seguida salve (<span className="font-mono">Ctrl+S</span>).
              </div>

              <div className="rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-neutral-950 text-emerald-200 p-4 overflow-x-auto custom-scrollbar-x max-h-[420px] overflow-y-auto custom-scrollbar-y">
                <pre className="text-[11px] font-mono leading-relaxed whitespace-pre select-all">
                  {appsScriptCode}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: READ-ONLY CSV FALLBACK */}
          {activeModalTab === 'csv' && (
            <div className="space-y-5">
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl p-4 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
                  <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Sincronização Simples via Link CSV (Somente Leitura de Usuários):</span>
                </div>
                <p className="text-neutral-700 dark:text-neutral-300">
                  Se preferir apenas validar logins e senhas sem implantar Apps Script, compartilhe sua planilha como <em>"Qualquer pessoa com o link pode ler"</em> e cole o link abaixo. (Para gravar pedidos automaticamente na planilha, use a aba <strong>1. Conectar Apps Script</strong>).
                </p>
              </div>

              <div className="space-y-3 bg-neutral-50 dark:bg-neutral-800/60 p-4 sm:p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700">
                <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  Link da Planilha Google Sheets:
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    value={csvUrlInput}
                    onChange={(e) => setCsvUrlInput(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/SEU_ID_AQUI/edit?usp=sharing"
                    className="flex-1 px-3.5 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs font-mono text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleSyncCsv}
                    disabled={isSyncingDatabase}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs shrink-0 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingDatabase ? 'animate-spin' : ''}`} />
                    <span>{isSyncingDatabase ? 'Sincronizando...' : 'Salvar & Sincronizar CSV'}</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between text-[11px] text-neutral-500 gap-2 pt-1">
                  <span>Status: <strong className="text-emerald-600 font-bold">{users.length} usuários cadastrados</strong> no banco</span>
                  {lastDatabaseSync && (
                    <span>Última sincronização: <strong>{new Date(lastDatabaseSync).toLocaleString('pt-BR')}</strong></span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                  Colunas esperadas: <span className="font-mono">Nome | Email | Senha | Setor | Perfil | Ativo</span>
                </span>
                <button
                  type="button"
                  onClick={handleCopyTemplate}
                  className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border border-neutral-300 dark:border-neutral-700 shadow-2xs"
                >
                  {copiedTemplate ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-neutral-500" />}
                  <span>{copiedTemplate ? 'Modelo Copiado!' : 'Copiar Modelo p/ Colar no Sheets'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: CURRENT LOADED USERS */}
          {activeModalTab === 'users' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    Usuários Atualmente Carregados no Banco ({users.length}):
                  </h4>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="text-[11px] text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 flex items-center gap-1 cursor-pointer font-semibold"
                >
                  {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPasswords ? 'Ocultar Senhas' : 'Ver Senhas'}</span>
                </button>
              </div>

              <div className="overflow-x-auto custom-scrollbar-x border border-neutral-200 dark:border-neutral-800 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-neutral-100 dark:bg-neutral-800 font-bold text-neutral-700 dark:text-neutral-300 border-b border-neutral-200 dark:border-neutral-700">
                      <th className="px-3 py-2">Nome</th>
                      <th className="px-3 py-2">E-mail</th>
                      <th className="px-3 py-2">Senha</th>
                      <th className="px-3 py-2">Perfil</th>
                      <th className="px-3 py-2">Setor</th>
                      <th className="px-3 py-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-mono text-[11px]">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                        <td className="px-3 py-2 font-sans font-semibold text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
                          {u.name}
                        </td>
                        <td className="px-3 py-2 text-emerald-700 dark:text-emerald-400 whitespace-nowrap font-bold">
                          {u.email}
                        </td>
                        <td className="px-3 py-2 text-neutral-600 dark:text-neutral-300 whitespace-nowrap">
                          {showPasswords ? (u.password || '123') : '••••••••'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            u.role === 'master'
                              ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300'
                              : u.role === 'admin'
                              ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-300'
                              : 'bg-sky-100 text-sky-900 dark:bg-sky-950/70 dark:text-sky-300'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-neutral-500 font-sans whitespace-nowrap">
                          {u.department || 'Geral'}
                        </td>
                        <td className={`px-3 py-2 text-center whitespace-nowrap font-bold ${u.active !== false ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {u.active !== false ? 'ATIVO' : 'DESATIVADO'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-neutral-50 dark:bg-neutral-800/80 px-6 py-3 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-between gap-3">
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
            {appsScriptUrl ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                Apps Script configurado
              </span>
            ) : (
              <span>Apps Script ainda não conectado</span>
            )}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 font-bold text-xs rounded-xl cursor-pointer transition-colors"
          >
            Concluir & Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
