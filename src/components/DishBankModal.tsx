import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Dish, DishCategory } from '../types';
import { CATEGORY_LABELS } from '../utils/validators';
import { 
  UtensilsCrossed, 
  Search, 
  Plus, 
  Trash2, 
  Filter, 
  X, 
  Check, 
  Sparkles,
  Flame,
  AlertCircle,
  Edit2
} from 'lucide-react';

interface DishBankModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DishBankModal: React.FC<DishBankModalProps> = ({ isOpen, onClose }) => {
  const { dishes, addDish, updateDish, removeDish, currentUser, isAdmin, isMaster } = useApp();

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);

  // New dish form state
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<DishCategory>('principal');
  const [newCalories, setNewCalories] = useState<number | ''>('');
  const [newAllergens, setNewAllergens] = useState<string>('');

  // Editing existing dish state
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<DishCategory>('principal');
  const [editCalories, setEditCalories] = useState<number | ''>('');
  const [editAllergens, setEditAllergens] = useState<string>('');

  if (!isOpen) return null;

  const categories: { key: string; label: string }[] = [
    { key: 'all', label: 'Todos os Pratos' },
    { key: 'principal', label: 'Pratos Principais (Rampa/Kilo)' },
    { key: 'grelhado_nobre', label: 'Grelhados Nobres (Kilo)' },
    { key: 'alternativa', label: 'Aves & Peixes' },
    { key: 'massa_especial', label: 'Massas Especiais (Kilo)' },
    { key: 'vegetariano', label: 'Vegetarianos' },
    { key: 'guarnicao', label: 'Guarnições' },
    { key: 'acompanhamento', label: 'Acompanhamentos' },
    { key: 'salada', label: 'Saladas' },
    { key: 'salada_fria', label: 'Pista Fria (Kilo)' },
    { key: 'sobremesa', label: 'Sobremesas' },
    { key: 'suco', label: 'Sucos' },
  ];

  const filteredDishes = dishes.filter((dish) => {
    const matchesCategory =
      activeCategoryFilter === 'all' || dish.category === activeCategoryFilter;
    const matchesSearch =
      dish.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (dish.allergens && dish.allergens.some((a) => a.toLowerCase().includes(searchTerm.toLowerCase())));
    return matchesCategory && matchesSearch;
  });

  const handleCreateDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!newName.trim()) return;

    const allergensList = newAllergens
      ? newAllergens.split(',').map((a) => a.trim()).filter(Boolean)
      : [];

    addDish({
      name: newName.trim(),
      category: newCategory,
      calories: newCalories ? Number(newCalories) : undefined,
      allergens: allergensList,
    });

    setNewName('');
    setNewCalories('');
    setNewAllergens('');
    setIsAddingNew(false);
  };

  const handleStartEditDish = (dish: Dish) => {
    setEditingDish(dish);
    setEditName(dish.name);
    setEditCategory(dish.category);
    setEditCalories(dish.calories ?? '');
    setEditAllergens(dish.allergens ? dish.allergens.join(', ') : '');
    setIsAddingNew(false);
  };

  const handleSaveEditDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !editingDish) return;
    if (!editName.trim()) return;

    const allergensList = editAllergens
      ? editAllergens.split(',').map((a) => a.trim()).filter(Boolean)
      : [];

    updateDish(editingDish.id, {
      name: editName.trim(),
      category: editCategory,
      calories: editCalories ? Number(editCalories) : undefined,
      allergens: allergensList,
    });

    setEditingDish(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-neutral-200 dark:border-neutral-800 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-neutral-900 dark:bg-black text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <UtensilsCrossed className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="text-base font-bold tracking-tight">Banco de Pratos & Receitas</h2>
              <p className="text-xs text-neutral-400">
                Catálogo institucional para abastecer os cardápios semanais sem repetições
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

        {/* Toolbar & Filters */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-800/40 space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar prato, ingrediente ou alérgeno..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2" />
            </div>

            {isAdmin && (
              <button
                onClick={() => setIsAddingNew(!isAddingNew)}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap self-start sm:self-auto shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAddingNew ? 'Cancelar' : 'Cadastrar Novo Prato'}</span>
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategoryFilter(cat.key)}
                className={`px-2.5 py-1 text-xs rounded-lg whitespace-nowrap transition-colors cursor-pointer shrink-0 font-medium ${
                  activeCategoryFilter === cat.key
                    ? 'bg-neutral-900 dark:bg-amber-600 text-white font-bold'
                    : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* New Dish Form (Collapsible) */}
        {isAddingNew && isAdmin && (
          <div className="p-4 bg-amber-50/70 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 shrink-0 animate-in fade-in duration-150">
            <h3 className="text-xs font-bold text-amber-950 dark:text-amber-200 uppercase tracking-wider mb-2">
              Cadastrar Novo Prato no Banco:
            </h3>
            <form onSubmit={handleCreateDish} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-0.5">
                    Nome do Prato / Preparação
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ex: Risoto de Alho-Poró com Parmesão"
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-0.5">
                    Categoria
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as DishCategory)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="principal">Prato Principal (Carne)</option>
                    <option value="grelhado_nobre">Grelhado Nobre (Kilo)</option>
                    <option value="alternativa">Ave ou Peixe</option>
                    <option value="massa_especial">Massa Especial (Kilo)</option>
                    <option value="vegetariano">Opção Vegetariana</option>
                    <option value="guarnicao">Guarnição</option>
                    <option value="acompanhamento">Acompanhamento Base</option>
                    <option value="salada">Salada</option>
                    <option value="salada_fria">Pista Fria / Salada Especial (Kilo)</option>
                    <option value="sobremesa">Sobremesa</option>
                    <option value="suco">Suco</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-0.5">
                    Calorias Aprox. (kcal)
                  </label>
                  <input
                    type="number"
                    value={newCalories}
                    onChange={(e) => setNewCalories(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Ex: 320"
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-0.5">
                    Alérgenos (separados por vírgula)
                  </label>
                  <input
                    type="text"
                    value={newAllergens}
                    onChange={(e) => setNewAllergens(e.target.value)}
                    placeholder="Ex: Leite / Lactose, Glúten"
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/50 dark:hover:bg-neutral-700 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Salvar Prato
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Edit Existing Dish Form (Collapsible) */}
        {editingDish && isAdmin && (
          <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/40 border-b border-emerald-300 dark:border-emerald-800 shrink-0 animate-in fade-in duration-150">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-emerald-950 dark:text-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
                <Edit2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Alterar Dados do Prato: <strong>{editingDish.name}</strong></span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingDish(null)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-0.5 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveEditDish} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-0.5">
                    Nome da Preparação
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-0.5">
                    Categoria
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as DishCategory)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="principal">Prato Principal (Carne)</option>
                    <option value="grelhado_nobre">Grelhado Nobre (Kilo)</option>
                    <option value="alternativa">Ave ou Peixe</option>
                    <option value="massa_especial">Massa Especial (Kilo)</option>
                    <option value="vegetariano">Opção Vegetariana</option>
                    <option value="guarnicao">Guarnição</option>
                    <option value="acompanhamento">Acompanhamento Base</option>
                    <option value="salada">Salada</option>
                    <option value="salada_fria">Pista Fria / Salada Especial (Kilo)</option>
                    <option value="sobremesa">Sobremesa</option>
                    <option value="suco">Suco</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-0.5">
                    Calorias Aprox. (kcal)
                  </label>
                  <input
                    type="number"
                    value={editCalories}
                    onChange={(e) => setEditCalories(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-0.5">
                    Alérgenos (separados por vírgula)
                  </label>
                  <input
                    type="text"
                    value={editAllergens}
                    onChange={(e) => setEditAllergens(e.target.value)}
                    placeholder="Ex: Glúten, Lactose, Soja"
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingDish(null)}
                  className="px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/50 dark:hover:bg-neutral-700 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Dishes Grid */}
        <div className="p-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredDishes.map((dish) => (
              <div
                key={dish.id}
                className="bg-white dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700 rounded-xl p-3 flex flex-col justify-between hover:border-amber-300 dark:hover:border-amber-500 transition-colors shadow-2xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-neutral-900 dark:text-neutral-100 text-xs leading-snug">
                      {dish.name}
                    </h4>
                    <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-700 px-1.5 py-0.2 rounded shrink-0">
                      {CATEGORY_LABELS[dish.category as keyof typeof CATEGORY_LABELS]}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-neutral-500 dark:text-neutral-400">
                    {dish.calories && (
                      <span className="flex items-center gap-0.5 font-mono text-neutral-600 dark:text-neutral-300">
                        <Flame className="w-3 h-3 text-amber-600 dark:text-amber-500" />
                        {dish.calories} kcal
                      </span>
                    )}

                    {dish.allergens && dish.allergens.length > 0 && (
                      <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                        Contém: {dish.allergens.join(', ')}
                      </span>
                    )}
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-700/60">
                    <button
                      type="button"
                      onClick={() => handleStartEditDish(dish)}
                      className="text-[11px] text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/50 px-2 py-0.5 rounded transition-colors flex items-center gap-1 cursor-pointer font-medium"
                      title="Editar informações deste prato existente"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Editar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Deseja remover "${dish.name}" do banco de pratos?`)) {
                          removeDish(dish.id);
                        }
                      }}
                      className="text-[11px] text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 px-2 py-0.5 rounded transition-colors flex items-center gap-1 cursor-pointer"
                      title="Excluir prato do catálogo"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Excluir</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredDishes.length === 0 && (
            <div className="py-12 text-center text-neutral-400 dark:text-neutral-500 text-xs">
              Nenhum prato encontrado para os filtros selecionados.
            </div>
          )}
        </div>

        <div className="bg-neutral-50 dark:bg-neutral-800/80 px-6 py-3 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-between shrink-0">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            Total de pratos cadastrados: <strong>{dishes.length}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-100 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
