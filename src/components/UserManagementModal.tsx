import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { isValidCancaoNovaEmail } from '../utils/validators';
import { 
  Users, 
  ShieldCheck, 
  Eye, 
  UserPlus, 
  Trash2, 
  Lock, 
  AlertCircle, 
  CheckCircle2, 
  X,
  Mail,
  LogIn,
  LogOut,
  ArrowRight
} from 'lucide-react';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLoginModal?: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({ isOpen, onClose, onOpenLoginModal }) => {
  const { users, currentUser, addUser, removeUser, clearAllUsers, updateUserRole, logout, switchUser } = useApp();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('leitor');
  const [department, setDepartment] = useState('Nutrição e Cozinha');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const isMaster = currentUser?.role === 'master';
  const isAdmin = currentUser?.role === 'admin' || isMaster;

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!isAdmin) {
      setErrorMsg('Apenas administradores podem cadastrar novos usuários.');
      return;
    }

    if (!name.trim()) {
      setErrorMsg('Por favor, digite o nome completo do usuário.');
      return;
    }

    if (!email.trim()) {
      setErrorMsg('Por favor, informe o e-mail corporativo.');
      return;
    }

    if (!isValidCancaoNovaEmail(email)) {
      setErrorMsg(
        'E-mail não autorizado! Somente endereços que contenham @cancaonova.com são aceitos pelo sistema.'
      );
      return;
    }

    const res = addUser(name, email, role, department);
    if (!res.success) {
      setErrorMsg(res.message || 'Erro ao cadastrar usuário.');
    } else {
      setSuccessMsg(`Usuário ${name} adicionado com sucesso com perfil ${role === 'admin' ? 'Administrador' : 'Apenas Leitura'}!`);
      setName('');
      setEmail('');
      setRole('leitor');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-neutral-200 dark:border-neutral-800 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-neutral-900 dark:bg-black text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="text-base font-bold tracking-tight">
                Gestão de Usuários & Permissões
              </h2>
              <p className="text-xs text-neutral-400">
                Controle de acesso restrito institucional @cancaonova.com
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* Domain security notice banner */}
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl p-3.5 flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
              <strong className="block font-semibold">Regra de Segurança:</strong>
              O sistema só permite adicionar colaboradores com e-mails oficiais que contenham{' '}
              <span className="font-mono font-bold text-amber-950 dark:text-amber-300">@cancaonova.com</span>. Cada colaborador pode ser configurado como{' '}
              <strong>Administrador</strong> (acesso completo de edição) ou <strong>Apenas Leitura</strong> (visualização e impressão).
            </div>
          </div>

          {/* Add User Form (Admin only) */}
          {isAdmin ? (
            <div className="bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-3 flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Adicionar Novo Colaborador</span>
              </h3>

              <form onSubmit={handleAddUser} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: João da Silva"
                      className="w-full px-3 py-1.5 text-xs border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      E-mail (@cancaonova.com)
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nome@cancaonova.com"
                        className="w-full pl-8 pr-3 py-1.5 text-xs border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                      />
                      <Mail className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Nível de Permissão
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full px-3 py-1.5 text-xs border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 cursor-pointer"
                    >
                      <option value="cliente">Cliente (Apenas Cardápio Rampa & Frutas)</option>
                      <option value="admin">Administrador Secundário (Edição dos Cardápios)</option>
                      <option value="leitor">Apenas Leitura (Visualizador Geral)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Setor / Departamento
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="Ex: Cozinha Central / Salão"
                      className="w-full px-3 py-1.5 text-xs border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                    />
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-lg text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs cursor-pointer"
                  >
                    Cadastrar Colaborador
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs text-neutral-600 dark:text-neutral-300">
              Você está conectado como <strong>Apenas Leitura</strong>. Somente administradores podem adicionar ou alterar permissões de outros usuários.
            </div>
          )}

          {/* Users List */}
          <div>
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <span>Colaboradores Cadastrados ({users.length})</span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono font-normal">
                  · Sincronizado com a planilha
                </span>
              </h3>

              {isAdmin && users.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`ATENÇÃO: Deseja realmente EXCLUIR TODOS OS USUÁRIOS (${users.length} cadastrados)?\n\nTodos os acessos serão removidos da planilha e o sistema retornará à tela de cadastro inicial.`)) {
                      clearAllUsers();
                      onClose();
                    }
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-300 dark:border-rose-800 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                  title="Excluir todos os usuários do sistema"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Excluir Todos os Usuários</span>
                </button>
              )}
            </div>

            {users.length === 0 ? (
              <div className="p-8 text-center bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 space-y-2">
                <Users className="w-8 h-8 text-neutral-400 mx-auto" />
                <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  Nenhum usuário cadastrado no momento.
                </p>
                <p className="text-[11px] text-neutral-500 max-w-sm mx-auto">
                  Todos os usuários foram removidos. Cadastre um novo colaborador acima ou pela tela de login/cadastro institucional.
                </p>
              </div>
            ) : (
              <div className="border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden divide-y divide-neutral-200 dark:divide-neutral-700">
                {users.map((u) => {
                  const isCurrent = currentUser?.id === u.id;
                  return (
                    <div
                      key={u.id}
                      className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                        isCurrent ? 'bg-amber-50/40 dark:bg-amber-950/30' : 'bg-white dark:bg-neutral-800/40 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-neutral-800 dark:bg-neutral-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-neutral-900 dark:text-neutral-100">{u.name}</span>
                            {isCurrent && (
                              <span className="text-[10px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.2 rounded">
                                Você
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">{u.email}</p>
                          <p className="text-[10px] text-neutral-400 dark:text-neutral-500">{u.department || 'Restaurante'}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                        {isCurrent ? (
                          <button
                            type="button"
                            onClick={() => logout()}
                            className="px-2.5 py-1 text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 rounded-lg border border-rose-200 dark:border-rose-900/60 transition-colors flex items-center gap-1 cursor-pointer"
                            title="Sair desta conta (Logout)"
                          >
                            <LogOut className="w-3 h-3 text-rose-600" />
                            <span>Sair</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => switchUser(u.id)}
                            className="px-2.5 py-1 text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 rounded-lg border border-amber-200 dark:border-amber-800 transition-colors flex items-center gap-1 cursor-pointer"
                            title="Fazer login como este usuário"
                          >
                            <LogIn className="w-3 h-3 text-amber-600" />
                            <span>Conectar</span>
                          </button>
                        )}

                        {u.role === 'master' ? (
                          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                            <span>👑</span>
                            <span>Admin MASTER</span>
                          </span>
                        ) : isAdmin ? (
                          <select
                            value={u.role}
                            onChange={(e) => updateUserRole(u.id, e.target.value as UserRole)}
                            className={`text-xs font-semibold rounded-lg px-2.5 py-1 border cursor-pointer ${
                              u.role === 'admin'
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                : u.role === 'cliente'
                                ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-800'
                                : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700'
                            }`}
                          >
                            <option value="admin">🛡️ Admin Secundário</option>
                            <option value="cliente">👤 Cliente (Rampa & Frutas)</option>
                            <option value="leitor">👁️ Apenas Leitura</option>
                          </select>
                        ) : (
                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                              u.role === 'admin'
                                ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300'
                                : u.role === 'cliente'
                                ? 'bg-sky-100 dark:bg-sky-900/50 text-sky-800 dark:text-sky-300'
                                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-300'
                            }`}
                          >
                            {u.role === 'admin' ? 'Admin Secundário' : u.role === 'cliente' ? 'Cliente' : 'Apenas Leitura'}
                          </span>
                        )}

                        {isAdmin && u.role !== 'master' && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(isCurrent ? `Deseja remover seu próprio usuário (${u.name})? Você será desconectado.` : `Deseja remover o usuário ${u.name}?`)) {
                                removeUser(u.id);
                                if (isCurrent && users.length <= 1) {
                                  onClose();
                                }
                              }
                            }}
                            className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Remover usuário"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="bg-neutral-50 dark:bg-neutral-800/80 px-6 py-3 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-between shrink-0">
          <div className="text-xs text-neutral-600 dark:text-neutral-300">
            {currentUser ? (
              <span className="flex items-center gap-1.5">
                <span>Conectado: <strong>{currentUser.name}</strong></span>
                <span className="text-[10px] bg-neutral-200 dark:bg-neutral-700 px-1.5 py-0.2 rounded font-mono font-bold">
                  {currentUser.role === 'master' ? '👑 Master' : currentUser.role === 'admin' ? '🛡️ Admin' : currentUser.role === 'cliente' ? '👤 Cliente' : '👁️ Leitor'}
                </span>
              </span>
            ) : (
              <span className="text-neutral-500 italic">Desconectado (Modo Visitante)</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentUser ? (
              <button
                type="button"
                onClick={() => logout()}
                className="px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Encerrar Sessão</span>
              </button>
            ) : (
              onOpenLoginModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenLoginModal();
                  }}
                  className="px-3 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Fazer Login</span>
                </button>
              )
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-100 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
