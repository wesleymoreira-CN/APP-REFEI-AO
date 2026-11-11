export type MenuType = 'rampa' | 'kilo';

export type UserRole = 'master' | 'admin' | 'cliente' | 'leitor';

export interface FruitOrderItem {
  id: string;
  name: string;
  icon?: string;
  quantity: number;
  unit: 'un' | 'kg' | 'porções' | 'fatias' | 'caixas';
  notes?: string;
}

export interface ClientMealItemRequest {
  id: string;
  category: string; // 'arroz' | 'feijao' | 'principal' | 'alternativa' | 'guarnicao' | 'salada' | 'sobremesa' | 'frutas'
  categoryLabel: string;
  dishName: string;
  peopleCount: number; // Quantidade de pessoas (ex: 5, 8, 10)
  icon?: string;
  notes?: string;
}

export interface ClientRampaOrder {
  id: string;
  orderNumber: string; // Ex: PED-RAMPA-101
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  departmentOrGroup: string; // Setor, Evento, Grupo ou Peregrinação
  orderDate: string; // Data do pedido
  serviceDate: string; // Data em que o cardápio rampa será servido
  dayName?: string; // Ex: 'Segunda-feira'
  mealShift: 'Almoço' | 'Jantar';
  numberOfPeople: number; // Quantidade de pessoas informada pelo cliente
  mealItems?: ClientMealItemRequest[]; // Quantidades específicas por item/pessoa
  fruits: FruitOrderItem[];
  specialDietNotes?: string;
  status: 'solicitado' | 'aprovado' | 'em_preparo' | 'entregue';
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
}

export type DishCategory =
  | 'principal'
  | 'alternativa'
  | 'vegetariano'
  | 'guarnicao'
  | 'acompanhamento'
  | 'salada'
  | 'sobremesa'
  | 'grelhado_nobre'
  | 'massa_especial'
  | 'salada_fria';

export interface Dish {
  id: string;
  name: string;
  category: DishCategory;
  menuType?: MenuType | 'ambos';
  description?: string;
  allergens?: string[];
  calories?: number;
  tags?: string[];
}

export interface MealSlot {
  principal: string[];
  alternativa: string[];
  vegetariano: string[];
  guarnicao: string[];
  acompanhamento: string[];
  salada: string[];
  sobremesa: string[];
  observacao?: string;
  // Campos adicionais específicos para o Cardápio Kilo (maior variedade de buffet)
  grelhadoNobre?: string[];
  massaEspecial?: string[];
  saladaEspecial?: string[];
}

export interface SampleCollectionItem {
  id: string;
  dishName: string;
  category: keyof MealSlot | string;
  categoryLabel: string;
  menuType: MenuType;
  dateStr: string;
  collectionTime: string;
  temperature: string;
  collectedBy: string;
  storageType: 'refrigerado' | 'congelado';
  retentionHours: number;
  lotCode: string;
}

export interface DayMenu {
  dayKey: string; // 'seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'
  dayName: string;
  dayShort: string;
  dateStr: string;
  lunch: MealSlot;
  dinner?: MealSlot;
}

export interface DishProductionQty {
  amount: number | string; // e.g. 35, 42.5, "35"
  unit: string; // 'kg' | 'litros' | 'porções' | 'unidades' | 'cubas GN' | 'g'
  pax?: number; // Comensais calculados
  perCapitaGrams?: number; // Gramas ou ml per capita
  notes?: string; // Instruções de preparo para a equipe de cozinha
}

export interface DayProduction {
  paxTarget?: number; // Meta de comensais / refeições do dia (ex: 450)
  quantities: Record<string, DishProductionQty>; // Chave: `${category}_${dishName}`
}

export interface WeeklyMenu {
  id: string;
  menuType: MenuType; // 'rampa' | 'kilo'
  year: number;
  month: number; // 1 to 12
  weekNumber: number; // 1 to 5
  startDate: string; // dd/mm
  endDate: string; // dd/mm
  status: 'planejamento' | 'aprovado' | 'publicado';
  days: {
    seg: DayMenu;
    ter: DayMenu;
    qua: DayMenu;
    qui: DayMenu;
    sex: DayMenu;
    sab: DayMenu;
    dom: DayMenu;
  };
  production?: Record<string, DayProduction>; // chave por dia: 'seg' | 'ter' | etc.
  notes?: string;
  updatedAt: string;
  updatedBy: string;
}

export interface RepetitionConflict {
  dishName: string;
  category: keyof MealSlot;
  categoryLabel: string;
  currentDayName: string;
  currentWeekNumber: number;
  currentMonth: number;
  currentYear?: number;
  conflictDayName: string;
  conflictWeekNumber: number;
  conflictMonth: number;
  conflictYear?: number;
  weeksDistance: number; // 0 = mesma semana, 1 = semana anterior/seguinte (distância 1), 2 = 2 semanas atrás/frente
  direction: 'anterior' | 'seguinte' | 'atual';
  severity: 'high' | 'medium';
  reason?: string;
}

export interface SpreadsheetRow {
  [key: string]: string | number | boolean | null;
}

export interface SpreadsheetColumn {
  key: string;
  label: string;
  width?: string;
  type?: 'text' | 'number' | 'date' | 'tag';
}

export interface SpreadsheetSheet {
  id: string;
  name: string;
  title: string;
  description: string;
  columns: SpreadsheetColumn[];
  rows: SpreadsheetRow[];
  totalRows: number;
  lastUpdated: string;
}

export interface SystemSpreadsheet {
  title: string;
  version: string;
  lastSyncedAt: string;
  totalRecords: number;
  sheets: {
    cardapios: SpreadsheetSheet;
    producao: SpreadsheetSheet;
    amostras: SpreadsheetSheet;
    pratos: SpreadsheetSheet;
    usuarios: SpreadsheetSheet;
    auditoria: SpreadsheetSheet;
    pedidos: SpreadsheetSheet;
  };
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  entity: string;
  details: string;
}
