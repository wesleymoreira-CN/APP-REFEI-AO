import { User, Dish, WeeklyMenu, MealSlot, MenuType } from '../types';
import { getWeekDates } from '../utils/validators';

export const INITIAL_USERS: User[] = [
  {
    id: 'user-1',
    name: 'Wesley Moreira',
    email: 'wesley.moreira@comunidadecancaonova.com',
    role: 'master', // Administrador MASTER
    department: 'Coordenação Geral de Nutrição e Alimentação',
    createdAt: '2026-01-10T08:00:00Z',
    lastLogin: '2026-10-30T10:30:00Z',
  },
  {
    id: 'user-2',
    name: 'Maria Cecília Silva',
    email: 'maria.silva@cancaonova.com',
    role: 'admin', // Administrador Secundário
    department: 'Chefe de Cozinha / Nutrição Clínica',
    createdAt: '2026-01-15T09:00:00Z',
    lastLogin: '2026-10-29T16:45:00Z',
  },
  {
    id: 'user-3',
    name: 'Lucas Ferreira (Eventos)',
    email: 'eventos.retiros@cancaonova.com',
    role: 'cliente', // Cliente: Solicitação de Cardápio Rampa & Frutas
    department: 'Coordenação de Retiros e Grandes Eventos',
    createdAt: '2026-02-01T11:00:00Z',
    lastLogin: '2026-10-30T09:15:00Z',
  },
  {
    id: 'user-4',
    name: 'Grupo Peregrinos de Fátima',
    email: 'cliente.peregrinos@cancaonova.com',
    role: 'cliente', // Cliente: Solicitação de Cardápio Rampa & Frutas
    department: 'Caravana de Peregrinação Canção Nova',
    createdAt: '2026-02-10T10:00:00Z',
    lastLogin: '2026-10-29T14:00:00Z',
  },
  {
    id: 'user-5',
    name: 'Equipe Cantina & Salão',
    email: 'cantina.refeitorio@cancaonova.com',
    role: 'leitor', // Leitor Geral
    department: 'Operações de Salão e Buffet',
    createdAt: '2026-02-15T14:20:00Z',
    lastLogin: '2026-10-28T18:00:00Z',
  },
];

export const INITIAL_DISHES: Dish[] = [
  // Principais / Carnes Bovinas e Suínas (Rampa & Kilo)
  { id: 'p1', name: 'Alcatra Grelhada ao Alho e Óleo', category: 'principal', calories: 340, allergens: [], menuType: 'ambos' },
  { id: 'p2', name: 'Carne de Panela com Cenoura e Batata', category: 'principal', calories: 380, allergens: [], menuType: 'rampa' },
  { id: 'p3', name: 'Estrogonofe de Carne Tradicional', category: 'principal', calories: 420, allergens: ['Leite / Lactose'], menuType: 'ambos' },
  { id: 'p4', name: 'Lombo Suíno Assado com Ervas Finas', category: 'principal', calories: 310, allergens: [], menuType: 'ambos' },
  { id: 'p5', name: 'Feijoada Completa Canção Nova', category: 'principal', calories: 550, allergens: [], menuType: 'ambos' },
  { id: 'p6', name: 'Picadinho Bife à Role Recheado', category: 'principal', calories: 360, allergens: [], menuType: 'rampa' },
  { id: 'p7', name: 'Costelinha Suína ao Barbecue Artesanal', category: 'principal', calories: 430, allergens: [], menuType: 'ambos' },
  { id: 'p8', name: 'Bife Acebolado com Manteiga de Garrafa', category: 'principal', calories: 370, allergens: ['Leite / Lactose'], menuType: 'ambos' },
  { id: 'p9', name: 'Kibe de Forno Recheado com Requeijão', category: 'principal', calories: 320, allergens: ['Trigo / Glúten', 'Leite / Lactose'], menuType: 'ambos' },

  // Grelhados Nobres Especiais (Exclusivo Restaurante Kilo)
  { id: 'gn1', name: 'Picanha Fatiada na Chapa com Sal Grosso', category: 'grelhado_nobre', calories: 410, allergens: [], menuType: 'kilo' },
  { id: 'gn2', name: 'Maminha Grelhada na Manteiga de Ervas', category: 'grelhado_nobre', calories: 380, allergens: ['Leite / Lactose'], menuType: 'kilo' },
  { id: 'gn3', name: 'Medalhão de Filé Mignon ao Molho Madeira', category: 'grelhado_nobre', calories: 390, allergens: [], menuType: 'kilo' },
  { id: 'gn4', name: 'Salmão Grelhado com Crosta de Ervas e Alcaparras', category: 'grelhado_nobre', calories: 310, allergens: ['Peixe'], menuType: 'kilo' },

  // Aves e Peixes (Alternativas)
  { id: 'a1', name: 'Filé de Frango Grelhado com Limão e Ervas', category: 'alternativa', calories: 240, allergens: [], menuType: 'ambos' },
  { id: 'a2', name: 'Frango Assado com Batatas Coradas', category: 'alternativa', calories: 290, allergens: [], menuType: 'rampa' },
  { id: 'a3', name: 'Sobrecoxa Desossada ao Curry Suave', category: 'alternativa', calories: 310, allergens: [], menuType: 'ambos' },
  { id: 'a4', name: 'Filé de Tilápia Grelhada ao Molho de Ervas', category: 'alternativa', calories: 220, allergens: ['Peixe'], menuType: 'ambos' },
  { id: 'a5', name: 'Iscas de Frango Empanadas ao Forno', category: 'alternativa', calories: 280, allergens: ['Trigo / Glúten'], menuType: 'ambos' },
  { id: 'a6', name: 'Peixe Assado com Crosta de Castanhas', category: 'alternativa', calories: 260, allergens: ['Peixe', 'Oleaginosas'], menuType: 'ambos' },
  { id: 'a7', name: 'Fricassê Cremoso de Frango', category: 'alternativa', calories: 350, allergens: ['Leite / Lactose'], menuType: 'rampa' },
  { id: 'a8', name: 'Moqueca de Cação com Pimentões Coloridos', category: 'alternativa', calories: 270, allergens: ['Peixe'], menuType: 'ambos' },
  { id: 'a9', name: 'Filé de Frango à Parmegiana Gratinado', category: 'alternativa', calories: 390, allergens: ['Trigo / Glúten', 'Leite / Lactose'], menuType: 'kilo' },

  // Vegetarianos & Massas
  { id: 'v1', name: 'Lasanha de Berinjela ao Sugo e Manjericão', category: 'vegetariano', calories: 250, allergens: ['Leite / Lactose'], menuType: 'ambos' },
  { id: 'v2', name: 'Omelete de Forno com Espinafre e Ricota', category: 'vegetariano', calories: 210, allergens: ['Ovos', 'Leite / Lactose'], menuType: 'ambos' },
  { id: 'v3', name: 'Almôndegas de Lentilha ao Molho Rústico', category: 'vegetariano', calories: 230, allergens: [], menuType: 'ambos' },
  { id: 'v4', name: 'Bobó Vegano de Grão de Bico e Abóbora', category: 'vegetariano', calories: 260, allergens: [], menuType: 'ambos' },
  { id: 'v5', name: 'Quiche Integral de Alho Poró', category: 'vegetariano', calories: 280, allergens: ['Trigo / Glúten', 'Ovos', 'Leite / Lactose'], menuType: 'ambos' },
  { id: 'v6', name: 'Risoto de Cogumelos e Parmesão', category: 'vegetariano', calories: 310, allergens: ['Leite / Lactose'], menuType: 'ambos' },
  { id: 'v7', name: 'Hamburguer de Feijão Preto e Aveia', category: 'vegetariano', calories: 220, allergens: ['Aveia'], menuType: 'rampa' },
  { id: 'v8', name: 'Torta de Legumes com Massa de Mandioca', category: 'vegetariano', calories: 240, allergens: ['Ovos'], menuType: 'rampa' },
  { id: 'm1', name: 'Nhoque Artesanal de Batata ao Molho Gorgonzola', category: 'massa_especial', calories: 360, allergens: ['Trigo / Glúten', 'Leite / Lactose'], menuType: 'kilo' },
  { id: 'm2', name: 'Rondelli 4 Queijos Gratinado no Forno a Lenha', category: 'massa_especial', calories: 390, allergens: ['Trigo / Glúten', 'Leite / Lactose'], menuType: 'kilo' },

  // Guarnições
  { id: 'g1', name: 'Purê de Batata com Noz-Moscada', category: 'guarnicao', calories: 150, allergens: ['Leite / Lactose'], menuType: 'ambos' },
  { id: 'g2', name: 'Farofa Rica Crocante com Bacon e Cenoura', category: 'guarnicao', calories: 190, allergens: [], menuType: 'ambos' },
  { id: 'g3', name: 'Legumes Salteados no Azeite e Tomilho', category: 'guarnicao', calories: 90, allergens: [], menuType: 'ambos' },
  { id: 'g4', name: 'Polenta Cremosa com Queijo', category: 'guarnicao', calories: 160, allergens: ['Leite / Lactose'], menuType: 'ambos' },
  { id: 'g5', name: 'Mandioca Cozida na Manteiga de Garrafa', category: 'guarnicao', calories: 170, allergens: ['Leite / Lactose'], menuType: 'ambos' },
  { id: 'g6', name: 'Batata Rústica Assada com Alecrim', category: 'guarnicao', calories: 140, allergens: [], menuType: 'ambos' },
  { id: 'g7', name: 'Couve Mineira Refogada no Alho', category: 'guarnicao', calories: 60, allergens: [], menuType: 'ambos' },
  { id: 'g8', name: 'Purê de Mandioquinha Perfumado', category: 'guarnicao', calories: 145, allergens: ['Leite / Lactose'], menuType: 'ambos' },

  // Acompanhamentos
  { id: 'ac1', name: 'Arroz Branco Agulhinha & Feijão Carioca', category: 'acompanhamento', calories: 210, menuType: 'ambos' },
  { id: 'ac2', name: 'Arroz Integral & Feijão Preto', category: 'acompanhamento', calories: 200, menuType: 'ambos' },
  { id: 'ac3', name: 'Arroz com Brócolis & Feijão Carioca', category: 'acompanhamento', calories: 215, menuType: 'ambos' },
  { id: 'ac4', name: 'Arroz 7 Grãos & Feijão Fradinho', category: 'acompanhamento', calories: 225, menuType: 'kilo' },

  // Saladas
  { id: 's1', name: 'Mix de Folhas Nobres, Tomate Cereja e Pepino', category: 'salada', calories: 45, menuType: 'ambos' },
  { id: 's2', name: 'Salada de Beterraba Cozida com Cheiro Verde', category: 'salada', calories: 55, menuType: 'ambos' },
  { id: 's3', name: 'Salada Coleslaw Tropical (Repolho e Abacaxi)', category: 'salada', calories: 75, menuType: 'ambos' },
  { id: 's4', name: 'Salada Caesar com Croutons Integrais', category: 'salada', calories: 95, allergens: ['Trigo / Glúten', 'Leite / Lactose'], menuType: 'ambos' },
  { id: 's5', name: 'Tabule Tradicional de Quinoa', category: 'salada', calories: 85, menuType: 'ambos' },
  { id: 's6', name: 'Salada de Grão de Bico com Vinagrete', category: 'salada', calories: 110, menuType: 'ambos' },
  { id: 's7', name: 'Salada Grega com Pepino, Tomate e Azeitonas', category: 'salada', calories: 90, allergens: ['Leite / Lactose'], menuType: 'ambos' },
  { id: 'sf1', name: 'Carpaccio de Abobrinha com Raspas de Limão Siciliano', category: 'salada_fria', calories: 65, menuType: 'kilo' },
  { id: 'sf2', name: 'Palmito Pupunha Assado com Ervas', category: 'salada_fria', calories: 80, menuType: 'kilo' },

  // Sobremesas
  { id: 'sb1', name: 'Pudim de Leite Condensado Artesanal', category: 'sobremesa', calories: 220, allergens: ['Leite / Lactose', 'Ovos'], menuType: 'ambos' },
  { id: 'sb2', name: 'Fruta Fresca da Estação (Melancia fatiada)', category: 'sobremesa', calories: 60, menuType: 'ambos' },
  { id: 'sb3', name: 'Mousse Cremosa de Maracujá', category: 'sobremesa', calories: 180, allergens: ['Leite / Lactose'], menuType: 'ambos' },
  { id: 'sb4', name: 'Abacaxi Grelhado com Canela', category: 'sobremesa', calories: 70, menuType: 'ambos' },
  { id: 'sb5', name: 'Gelatina Bicolor de Frutas Vermelhas', category: 'sobremesa', calories: 50, menuType: 'rampa' },
  { id: 'sb6', name: 'Doce de Abóbora com Coco Natural', category: 'sobremesa', calories: 120, menuType: 'ambos' },
  { id: 'sb7', name: 'Salada de Frutas com Laranja e Maçã', category: 'sobremesa', calories: 75, menuType: 'ambos' },
  { id: 'sb8', name: 'Torta Holandesa com Ganache de Chocolate Belga', category: 'sobremesa', calories: 310, allergens: ['Leite / Lactose', 'Trigo / Glúten'], menuType: 'kilo' },
];

export function createEmptyMealSlot(): MealSlot {
  return {
    principal: [],
    alternativa: [],
    vegetariano: [],
    guarnicao: [],
    acompanhamento: ['Arroz Branco Agulhinha & Feijão Carioca'],
    salada: [],
    sobremesa: [],
    observacao: '',
    grelhadoNobre: [],
    massaEspecial: [],
    saladaEspecial: [],
  };
}

export function createEmptyWeeklyMenu(
  year: number,
  month: number,
  weekNumber: number,
  menuType: MenuType = 'rampa'
): WeeklyMenu {
  const dayNames = [
    { key: 'seg', name: 'Segunda-feira', short: 'Seg' },
    { key: 'ter', name: 'Terça-feira', short: 'Ter' },
    { key: 'qua', name: 'Quarta-feira', short: 'Qua' },
    { key: 'qui', name: 'Quinta-feira', short: 'Qui' },
    { key: 'sex', name: 'Sexta-feira', short: 'Sex' },
    { key: 'sab', name: 'Sábado', short: 'Sáb' },
    { key: 'dom', name: 'Domingo', short: 'Dom' },
  ];

  const { startFormatted, endFormatted, daysDates } = getWeekDates(year, month, weekNumber);

  const daysObj: any = {};
  dayNames.forEach((d, idx) => {
    const computedDate = daysDates[idx] ? daysDates[idx].dateStr : `${idx + 1}/${month}`;
    daysObj[d.key] = {
      dayKey: d.key,
      dayName: d.name,
      dayShort: d.short,
      dateStr: computedDate,
      lunch: createEmptyMealSlot(),
    };
  });

  return {
    id: `menu-${year}-${month}-w${weekNumber}-${menuType}`,
    menuType,
    year,
    month,
    weekNumber,
    startDate: startFormatted,
    endDate: endFormatted,
    status: 'planejamento',
    days: daysObj,
    notes: '',
    updatedAt: new Date().toISOString(),
    updatedBy: 'Sistema',
  };
}

export function generateInitialMenus(): Record<string, WeeklyMenu> {
  const menus: Record<string, WeeklyMenu> = {};

  // ==========================================
  // 1. CARDÁPIO RAMPA (REFEITÓRIO) - OUTUBRO
  // ==========================================
  const rampa_w1 = createEmptyWeeklyMenu(2026, 10, 1, 'rampa');
  rampa_w1.status = 'publicado';
  rampa_w1.days.seg.lunch = {
    ...createEmptyMealSlot(),
    principal: ['Alcatra Grelhada ao Alho e Óleo'],
    alternativa: ['Filé de Frango Grelhado com Limão e Ervas'],
    vegetariano: ['Lasanha de Berinjela ao Sugo e Manjericão'],
    guarnicao: ['Purê de Batata com Noz-Moscada', 'Legumes Salteados no Azeite e Tomilho'],
    acompanhamento: ['Arroz Branco Agulhinha & Feijão Carioca'],
    salada: ['Mix de Folhas Nobres, Tomate Cereja e Pepino', 'Salada de Beterraba Cozida com Cheiro Verde'],
    sobremesa: ['Pudim de Leite Condensado Artesanal', 'Fruta Fresca da Estação (Melancia fatiada)'],
  };
  rampa_w1.days.ter.lunch = {
    ...createEmptyMealSlot(),
    principal: ['Carne de Panela com Cenoura e Batata'],
    alternativa: ['Sobrecoxa Desossada ao Curry Suave'],
    vegetariano: ['Omelete de Forno com Espinafre e Ricota'],
    guarnicao: ['Legumes Salteados no Azeite e Tomilho'],
    acompanhamento: ['Arroz Branco & Feijão Preto'],
    salada: ['Salada de Beterraba Cozida com Cheiro Verde'],
    sobremesa: ['Fruta Fresca da Estação (Melancia fatiada)'],
  };
  rampa_w1.days.qua.lunch = {
    ...createEmptyMealSlot(),
    principal: ['Feijoada Completa Canção Nova'],
    alternativa: ['Filé de Tilápia Grelhada ao Molho de Ervas'],
    vegetariano: ['Bobó Vegano de Grão de Bico e Abóbora'],
    guarnicao: ['Farofa Rica Crocante com Bacon e Cenoura', 'Couve Mineira Refogada no Alho'],
    acompanhamento: ['Arroz Branco & Feijão Preto'],
    salada: ['Salada Coleslaw Tropical (Repolho e Abacaxi)'],
    sobremesa: ['Abacaxi Grelhado com Canela'],
  };
  rampa_w1.days.qui.lunch = {
    ...createEmptyMealSlot(),
    principal: ['Lombo Suíno Assado com Ervas Finas'],
    alternativa: ['Iscas de Frango Empanadas ao Forno'],
    vegetariano: ['Quiche Integral de Alho Poró'],
    guarnicao: ['Polenta Cremosa com Queijo'],
    acompanhamento: ['Arroz Integral & Feijão Carioca'],
    salada: ['Salada Caesar com Croutons Integrais'],
    sobremesa: ['Gelatina Bicolor de Frutas Vermelhas'],
  };
  rampa_w1.days.sex.lunch = {
    ...createEmptyMealSlot(),
    principal: ['Moqueca de Cação com Pimentões Coloridos'],
    alternativa: ['Frango Assado com Batatas Coradas'],
    vegetariano: ['Risoto de Cogumelos e Parmesão'],
    guarnicao: ['Pirão de Peixe Perfumado'],
    acompanhamento: ['Arroz Branco & Feijão Carioca'],
    salada: ['Tabule Tradicional de Quinoa'],
    sobremesa: ['Mousse Cremosa de Maracujá'],
  };
  rampa_w1.days.sab.lunch = {
    ...createEmptyMealSlot(),
    principal: ['Costelinha Suína ao Barbecue Artesanal'],
    alternativa: ['Filé de Frango Grelhado com Limão e Ervas'],
    vegetariano: ['Hamburguer de Feijão Preto e Aveia'],
    guarnicao: ['Batata Rústica Assada com Alecrim'],
    acompanhamento: ['Arroz Branco & Feijão Preto'],
    salada: ['Mix de Folhas Nobres, Tomate Cereja e Pepino'],
    sobremesa: ['Doce de Abóbora com Coco Natural'],
  };
  rampa_w1.days.dom.lunch = {
    ...createEmptyMealSlot(),
    principal: ['Estrogonofe de Carne Tradicional'],
    alternativa: ['Peixe Assado com Crosta de Castanhas'],
    vegetariano: ['Torta de Legumes com Massa de Mandioca'],
    guarnicao: ['Batata Palha Artesanal e Arroz Branco'],
    acompanhamento: ['Arroz Branco Agulhinha & Feijão Carioca'],
    salada: ['Salada Grega com Pepino, Tomate e Azeitonas'],
    sobremesa: ['Salada de Frutas com Laranja e Maçã'],
  };
  menus[rampa_w1.id] = rampa_w1;

  // Semana 2 Rampa
  const rampa_w2 = createEmptyWeeklyMenu(2026, 10, 2, 'rampa');
  rampa_w2.status = 'planejamento';
  rampa_w2.days.seg.lunch = {
    ...createEmptyMealSlot(),
    principal: ['Picadinho Bife à Role Recheado'],
    alternativa: ['Fricassê Cremoso de Frango'],
    vegetariano: ['Almôndegas de Lentilha ao Molho Rústico'],
    guarnicao: ['Purê de Mandioquinha Perfumado', 'Farofa Rica Crocante com Bacon e Cenoura'],
    acompanhamento: ['Arroz Branco Agulhinha & Feijão Carioca'],
    salada: ['Salada de Grão de Bico com Vinagrete'],
    sobremesa: ['Doce de Abóbora com Coco Natural'],
  };
  rampa_w2.days.ter.lunch = {
    ...createEmptyMealSlot(),
    // Repetido da semana 1 para demonstrar o detector
    principal: ['Carne de Panela com Cenoura e Batata'],
    alternativa: ['Filé de Tilápia Grelhada ao Molho de Ervas'],
    vegetariano: ['Bobó Vegano de Grão de Bico e Abóbora'],
    guarnicao: ['Mandioca Cozida na Manteiga de Garrafa'],
    acompanhamento: ['Arroz Branco & Feijão Carioca'],
    salada: ['Mix de Folhas Nobres, Tomate Cereja e Pepino'],
    sobremesa: ['Fruta Fresca da Estação (Melancia fatiada)'],
  };
  rampa_w2.days.qua.lunch = {
    ...createEmptyMealSlot(),
    principal: ['Bife Acebolado com Manteiga de Garrafa'],
    alternativa: ['Frango Assado com Batatas Coradas'],
    vegetariano: ['Quiche Integral de Alho Poró'],
    guarnicao: ['Legumes Salteados no Azeite e Tomilho'],
    acompanhamento: ['Arroz Branco & Feijão Preto'],
    salada: ['Salada de Beterraba Cozida com Cheiro Verde'],
    sobremesa: ['Abacaxi Grelhado com Canela'],
  };
  rampa_w2.days.qui.lunch = {
    ...createEmptyMealSlot(),
    principal: ['Kibe de Forno Recheado com Requeijão'],
    alternativa: ['Sobrecoxa Desossada ao Curry Suave'],
    vegetariano: ['Lasanha de Berinjela ao Sugo e Manjericão'],
    guarnicao: ['Couve Mineira Refogada no Alho'],
    acompanhamento: ['Arroz Integral & Feijão Carioca'],
    salada: ['Salada Coleslaw Tropical (Repolho e Abacaxi)'],
    sobremesa: ['Pudim de Leite Condensado Artesanal'],
  };
  rampa_w2.days.sex.lunch = {
    ...createEmptyMealSlot(),
    principal: ['Peixe Assado com Crosta de Castanhas'],
    alternativa: ['Iscas de Frango Empanadas ao Forno'],
    vegetariano: ['Omelete de Forno com Espinafre e Ricota'],
    guarnicao: ['Batata Rústica Assada com Alecrim'],
    acompanhamento: ['Arroz Branco & Feijão Carioca'],
    salada: ['Salada Caesar com Croutons Integrais'],
    sobremesa: ['Mousse Cremosa de Maracujá'],
  };
  rampa_w2.days.sab.lunch = {
    ...createEmptyMealSlot(),
    principal: ['Lombo Suíno Assado com Ervas Finas'],
    alternativa: ['Filé de Frango Grelhado com Limão e Ervas'],
    vegetariano: ['Risoto de Cogumelos e Parmesão'],
    guarnicao: ['Farofa Rica Crocante com Bacon e Cenoura'],
    acompanhamento: ['Arroz Branco & Feijão Preto'],
    salada: ['Tabule Tradicional de Quinoa'],
    sobremesa: ['Gelatina Bicolor de Frutas Vermelhas'],
  };
  rampa_w2.days.dom.lunch = {
    ...createEmptyMealSlot(),
    principal: ['Alcatra Grelhada ao Alho e Óleo'],
    alternativa: ['Moqueca de Cação com Pimentões Coloridos'],
    vegetariano: ['Hamburguer de Feijão Preto e Aveia'],
    guarnicao: ['Polenta Cremosa com Queijo'],
    acompanhamento: ['Arroz Branco & Feijão Carioca'],
    salada: ['Salada Grega com Pepino, Tomate e Azeitonas'],
    sobremesa: ['Salada de Frutas com Laranja e Maçã'],
  };
  menus[rampa_w2.id] = rampa_w2;

  // ==========================================
  // 2. CARDÁPIO KILO (RESTAURANTE POR QUILO)
  // ==========================================
  const kilo_w1 = createEmptyWeeklyMenu(2026, 10, 1, 'kilo');
  kilo_w1.status = 'publicado';
  kilo_w1.days.seg.lunch = {
    ...createEmptyMealSlot(),
    principal: ['Picanha Fatiada na Chapa com Sal Grosso', 'Costela Gaúcha Assada na Brasa'],
    grelhadoNobre: ['Medalhão de Filé Mignon ao Molho Madeira'],
    alternativa: ['Filé de Frango Grelhado com Limão e Ervas'],
    massaEspecial: ['Nhoque Artesanal de Batata ao Molho Gorgonzola'],
    vegetariano: ['Risoto de Cogumelos e Parmesão'],
    guarnicao: ['Batata Rústica Assada com Alecrim', 'Legumes Salteados no Azeite e Tomilho'],
    acompanhamento: ['Arroz 7 Grãos & Feijão Carioca', 'Arroz Branco'],
    salada: ['Salada Caesar com Croutons Integrais', 'Mix de Folhas Nobres, Tomate Cereja e Pepino'],
    saladaEspecial: ['Carpaccio de Abobrinha com Raspas de Limão Siciliano'],
    sobremesa: ['Torta Holandesa com Ganache de Chocolate Belga', 'Pudim de Leite Condensado Artesanal'],
  };
  kilo_w1.days.ter.lunch = {
    ...createEmptyMealSlot(),
    principal: ['Maminha Grelhada na Manteiga de Ervas'],
    grelhadoNobre: ['Filé de Tilápia Grelhada ao Molho de Ervas'],
    alternativa: ['Filé de Frango à Parmegiana Gratinado'],
    massaEspecial: ['Rondelli 4 Queijos Gratinado no Forno a Lenha'],
    vegetariano: ['Quiche Integral de Alho Poró'],
    guarnicao: ['Legumes Salteados no Azeite e Tomilho', 'Purê de Mandioquinha Perfumado'],
    acompanhamento: ['Arroz Branco & Feijão Preto'],
    salada: ['Mix de Folhas Nobres, Tomate Cereja e Pepino'],
    saladaEspecial: ['Palmito Pupunha Assado com Ervas'],
    sobremesa: ['Pudim de Leite Condensado Artesanal'],
  };
  kilo_w1.days.qua.lunch = {
    ...createEmptyMealSlot(),
    principal: ['Costela Gaúcha Assada na Brasa'],
    grelhadoNobre: ['Salmão Grelhado com Crosta de Ervas e Alcaparras'],
    alternativa: ['Sobrecoxa Desossada ao Curry Suave'],
    massaEspecial: ['Lasanha de Berinjela ao Sugo e Manjericão'],
    vegetariano: ['Bobó Vegano de Grão de Bico e Abóbora'],
    guarnicao: ['Farofa Rica Crocante com Bacon e Cenoura'],
    acompanhamento: ['Arroz Branco Agulhinha & Feijão Carioca'],
    salada: ['Salada Grega com Pepino, Tomate e Azeitonas'],
    saladaEspecial: ['Tabule Tradicional de Quinoa'],
    sobremesa: ['Mousse Cremosa de Maracujá'],
  };
  kilo_w1.days.qui.lunch = {
    ...createEmptyMealSlot(),
    principal: ['Bife Ancho Grelhado com Chimichurri'],
    grelhadoNobre: ['Lombo Suíno Assado com Ervas Finas'],
    alternativa: ['Iscas de Frango Empanadas ao Forno'],
    massaEspecial: ['Fettuccine ao Molho Alfredo Artesanal'],
    vegetariano: ['Omelete de Forno com Espinafre e Ricota'],
    guarnicao: ['Purê de Mandioquinha Perfumado'],
    acompanhamento: ['Arroz Integral & Feijão Vermelho'],
    salada: ['Salada de Grão de Bico com Vinagrete'],
    saladaEspecial: ['Mix de Folhas com Figos e Nozes'],
    sobremesa: ['Abacaxi Grelhado com Canela'],
  };
  kilo_w1.days.sex.lunch = {
    ...createEmptyMealSlot(),
    principal: ['Picanha Suína Grelhada ao Alho'],
    grelhadoNobre: ['Bacalhau em Lascas ao Forno com Batatas ao Murro'],
    alternativa: ['Frango Assado com Ervas de Provence'],
    massaEspecial: ['Ravioli de Búfala ao Molho Pomodoro'],
    vegetariano: ['Risoto de Palmito Pupunha e Alho Poró'],
    guarnicao: ['Mandioca Cozida na Manteiga de Garrafa'],
    acompanhamento: ['Arroz Branco & Feijão Carioca'],
    salada: ['Salada Coleslaw Tropical (Repolho e Abacaxi)'],
    saladaEspecial: ['Carpaccio de Beterraba com Rúcula'],
    sobremesa: ['Torta Holandesa com Ganache de Chocolate Belga'],
  };
  kilo_w1.days.sab.lunch = {
    ...createEmptyMealSlot(),
    principal: ['Churrasco Misto Nobre (Picanha, Alcatra e Linguiça Artesanal)'],
    grelhadoNobre: ['Salmão com Crosta de Castanhas'],
    alternativa: ['Galeto Primo Canto Desossado'],
    massaEspecial: ['Espaguete ao Frutos do Mar'],
    vegetariano: ['Quiche de Alho Poró e Tomate Seco'],
    guarnicao: ['Polenta Frita Crocante com Queijo'],
    acompanhamento: ['Arroz Branco & Feijão Tropeiro'],
    salada: ['Mix de Folhas Nobres com Tomatinhos Confitados'],
    saladaEspecial: ['Salada de Grão de Bico com Bacalhau'],
    sobremesa: ['Pudim de Leite Condensado Artesanal'],
  };
  kilo_w1.days.dom.lunch = {
    ...createEmptyMealSlot(),
    principal: ['Filé Mignon ao Molho de Cogumelos Paris'],
    grelhadoNobre: ['Robalo Grelhado ao Molho de Maracujá'],
    alternativa: ['Peito de Frango Recheado com Queijo Brie'],
    massaEspecial: ['Nhoque de Mandioquinha ao Sugo Rústico'],
    vegetariano: ['Lasanha Quatro Queijos Gratinada'],
    guarnicao: ['Batata Gratinada Dauphinoise'],
    acompanhamento: ['Arroz Branco Agulhinha & Feijão Carioca'],
    salada: ['Salada Waldorf com Maçã e Nozes'],
    saladaEspecial: ['Salada de Quinoa Real com Legumes Tostados'],
    sobremesa: ['Taça Gourmet de Morangos com Chantilly'],
  };
  menus[kilo_w1.id] = kilo_w1;

  // Semana 2 Kilo
  const kilo_w2 = createEmptyWeeklyMenu(2026, 10, 2, 'kilo');
  kilo_w2.status = 'planejamento';
  kilo_w2.days.seg.lunch = {
    ...createEmptyMealSlot(),
    principal: ['Baby Beef Grelhado na Brasa'],
    grelhadoNobre: ['Filé de Tilápia com Crosta de Castanha de Caju'],
    alternativa: ['Sobrecoxa ao Molho Mostarda e Mel'],
    massaEspecial: ['Talharim Artesanal ao Molho Funghi Secchi'],
    vegetariano: ['Almôndegas de Lentilha ao Molho Rústico'],
    guarnicao: ['Purê de Batata com Noz-Moscada'],
    acompanhamento: ['Arroz Integral & Feijão Carioca'],
    salada: ['Mix de Folhas Nobres, Tomate Cereja e Pepino'],
    saladaEspecial: ['Salada de Cuscuz Marroquino com Ervas'],
    sobremesa: ['Salada de Frutas com Laranja e Maçã'],
  };
  menus[kilo_w2.id] = kilo_w2;

  return menus;
}
