import { WeeklyMenu, User, Dish, SystemSpreadsheet, SpreadsheetSheet, SpreadsheetRow, AuditLogEntry, ClientRampaOrder } from '../types';
import { CATEGORY_LABELS } from './validators';
import { getOrderRetentionInfo } from './orderRetention';
import { buildDailyOrderProductionSummaries } from './dailyOrderCalculations';

const DEFAULT_PAX_RAMPA = 400;
const DEFAULT_PAX_KILO = 250;

const DAY_LABELS: Record<string, string> = {
  seg: 'Segunda-feira',
  ter: 'Terça-feira',
  qua: 'Quarta-feira',
  qui: 'Quinta-feira',
  sex: 'Sexta-feira',
  sab: 'Sábado',
  dom: 'Domingo',
};

/**
 * Builds the complete multi-sheet spreadsheet data model directly backing the interface.
 * Satisfies: "crie uma planilha por detrás desta interface e que tudo o que eu fizer vá diretamente para a planilha"
 */
export function buildSystemSpreadsheet(
  menus: Record<string, WeeklyMenu>,
  users: User[],
  dishes: Dish[],
  auditLog: AuditLogEntry[],
  clientOrders: ClientRampaOrder[] = []
): SystemSpreadsheet {
  const now = new Date().toISOString();

  // 1. Sheet: Cardápios Semanais
  const cardapiosRows: SpreadsheetRow[] = [];
  let cardapioRowId = 1;

  Object.values(menus).forEach((menu) => {
    const daysKeys = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'] as const;
    daysKeys.forEach((dKey) => {
      const dayData = menu.days[dKey];
      if (!dayData) return;

      const categories: (keyof typeof dayData.lunch)[] = [
        'principal',
        'alternativa',
        'vegetariano',
        'guarnicao',
        'acompanhamento',
        'salada',
        'sobremesa',
        'grelhadoNobre',
        'massaEspecial',
        'saladaEspecial',
      ];

      categories.forEach((cat) => {
        const items = dayData.lunch[cat];
        if (Array.isArray(items) && items.length > 0) {
          items.forEach((dishName) => {
            if (!dishName || !dishName.trim()) return;
            cardapiosRows.push({
              Linha: cardapioRowId++,
              ID_Menu: menu.id,
              Ano: menu.year,
              Mes: menu.month,
              Semana: menu.weekNumber,
              Periodo: `${menu.startDate} a ${menu.endDate}`,
              Dia_Chave: dKey,
              Dia_Semana: DAY_LABELS[dKey] || dKey,
              Data_Dia: dayData.dateStr || menu.startDate,
              Tipo_Cardapio: menu.menuType === 'kilo' ? 'A Quilo' : 'Rampa',
              Categoria_Codigo: cat,
              Categoria_Nome: CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] || cat,
              Prato_Preparacao: dishName,
              Status_Cardapio: menu.status === 'aprovado' ? 'Aprovado' : menu.status === 'publicado' ? 'Publicado' : 'Planejamento',
              Ultima_Atualizacao: (menu as any).updatedAt || now,
              Atualizado_Por: (menu as any).updatedBy || 'Nutrição',
            });
          });
        }
      });
    });
  });

  const cardapiosSheet: SpreadsheetSheet = {
    id: 'cardapios',
    name: 'Cardapios_Semanais',
    title: 'Planejamento de Cardápios Semanais',
    description: 'Registro de todas as preparações escaladas por dia, categoria e modalidade (Rampa/Quilo).',
    columns: [
      { key: 'Linha', label: '#', width: '60px', type: 'number' },
      { key: 'Ano', label: 'Ano', width: '80px', type: 'number' },
      { key: 'Mes', label: 'Mês', width: '70px', type: 'number' },
      { key: 'Semana', label: 'Sem.', width: '70px', type: 'number' },
      { key: 'Dia_Semana', label: 'Dia da Semana', width: '130px', type: 'text' },
      { key: 'Data_Dia', label: 'Data', width: '100px', type: 'date' },
      { key: 'Tipo_Cardapio', label: 'Tipo Cardápio', width: '110px', type: 'tag' },
      { key: 'Categoria_Nome', label: 'Categoria', width: '160px', type: 'text' },
      { key: 'Prato_Preparacao', label: 'Prato / Preparação', width: '220px', type: 'text' },
      { key: 'Status_Cardapio', label: 'Status', width: '110px', type: 'tag' },
      { key: 'Atualizado_Por', label: 'Modificado Por', width: '140px', type: 'text' },
    ],
    rows: cardapiosRows,
    totalRows: cardapiosRows.length,
    lastUpdated: now,
  };

  // 2. Sheet: Fichas de Produção & Cozinha
  const producaoRows: SpreadsheetRow[] = [];
  let producaoRowId = 1;

  Object.values(menus).forEach((menu) => {
    const defaultPax = menu.menuType === 'kilo' ? DEFAULT_PAX_KILO : DEFAULT_PAX_RAMPA;
    const daysKeys = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'] as const;

    daysKeys.forEach((dKey) => {
      const dayData = menu.days[dKey];
      const prodDay = menu.production?.[dKey];
      const pax = prodDay?.paxTarget || defaultPax;
      if (!dayData) return;

      const categories: (keyof typeof dayData.lunch)[] = [
        'principal',
        'alternativa',
        'vegetariano',
        'guarnicao',
        'acompanhamento',
        'salada',
        'sobremesa',
      ];

      categories.forEach((cat) => {
        const items = dayData.lunch[cat];
        if (Array.isArray(items)) {
          items.forEach((dishName) => {
            if (!dishName || !dishName.trim()) return;
            const qKey = `${cat}_${dishName}`;
            const qtyInfo = prodDay?.quantities?.[qKey];
            const qty = qtyInfo ? Number(qtyInfo.amount) || 15 : 15;
            const unit = qtyInfo?.unit || 'kg';

            producaoRows.push({
              Linha: producaoRowId++,
              Ano: menu.year,
              Mes: menu.month,
              Semana: menu.weekNumber,
              Dia_Semana: DAY_LABELS[dKey] || dKey,
              Data_Producao: dayData.dateStr || menu.startDate,
              Tipo_Cardapio: menu.menuType === 'kilo' ? 'A Quilo' : 'Rampa',
              Categoria: CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] || cat,
              Prato: dishName,
              Quantidade_Prevista: qty,
              Unidade: unit,
              Comensais_PAX: pax,
              Gramas_Por_Comensal: unit === 'kg' ? Math.round((qty * 1000) / (pax || 1)) : unit === 'L' ? Math.round((qty * 1000) / (pax || 1)) : qty,
              Observacoes: qtyInfo?.notes || '',
              Data_Sincronizacao: now,
            });
          });
        }
      });
    });
  });

  const producaoSheet: SpreadsheetSheet = {
    id: 'producao',
    name: 'Fichas_Producao',
    title: 'Fichas Técnicas & Ordens de Produção da Cozinha',
    description: 'Cálculo de quantidades brutas (kg/L/un), comensais (PAX) e porções individuais para a equipe da cozinha.',
    columns: [
      { key: 'Linha', label: '#', width: '60px', type: 'number' },
      { key: 'Data_Producao', label: 'Data', width: '100px', type: 'date' },
      { key: 'Dia_Semana', label: 'Dia', width: '120px', type: 'text' },
      { key: 'Tipo_Cardapio', label: 'Cardápio', width: '100px', type: 'tag' },
      { key: 'Categoria', label: 'Categoria', width: '150px', type: 'text' },
      { key: 'Prato', label: 'Prato / Item', width: '200px', type: 'text' },
      { key: 'Quantidade_Prevista', label: 'Qtd. a Fazer', width: '100px', type: 'number' },
      { key: 'Unidade', label: 'Unid.', width: '70px', type: 'tag' },
      { key: 'Comensais_PAX', label: 'PAX (Comensais)', width: '120px', type: 'number' },
      { key: 'Gramas_Por_Comensal', label: 'g / ml p/ PAX', width: '110px', type: 'number' },
      { key: 'Observacoes', label: 'Observações Cozinha', width: '180px', type: 'text' },
    ],
    rows: producaoRows,
    totalRows: producaoRows.length,
    lastUpdated: now,
  };

  // 3. Sheet: Etiquetas de Amostras RDC 216
  const amostrasRows: SpreadsheetRow[] = [];
  let amostraRowId = 1;

  Object.values(menus).forEach((menu) => {
    const daysKeys = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'] as const;
    daysKeys.forEach((dKey) => {
      const dayData = menu.days[dKey];
      if (!dayData) return;

      const categories: (keyof typeof dayData.lunch)[] = [
        'principal',
        'alternativa',
        'vegetariano',
        'guarnicao',
        'acompanhamento',
        'salada',
        'sobremesa',
      ];

      categories.forEach((cat) => {
        const items = dayData.lunch[cat];
        if (Array.isArray(items)) {
          items.forEach((dishName) => {
            if (!dishName || !dishName.trim()) return;
            const isQuente = cat === 'principal' || cat === 'alternativa' || cat === 'guarnicao' || cat === 'acompanhamento';
            amostrasRows.push({
              Linha: amostraRowId++,
              ID_Amostra: `AMO-${menu.year}${String(menu.month).padStart(2, '0')}-${dKey}-${amostraRowId}`,
              Data_Coleta: dayData.dateStr || menu.startDate,
              Horario_Coleta: '11:45',
              Dia_Semana: DAY_LABELS[dKey] || dKey,
              Tipo_Cardapio: menu.menuType === 'kilo' ? 'A Quilo' : 'Rampa',
              Preparacao_Alimento: dishName,
              Categoria: CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] || cat,
              Temperatura_Padrao: isQuente ? '≥ 60 °C (Quente)' : '≤ 10 °C (Frio)',
              Tempo_Guarda_Horas: '72 horas',
              Norma_Sanitaria: 'RDC 216 / ANVISA',
              Responsavel_Coleta: 'Nutrição & Controle de Qualidade',
            });
          });
        }
      });
    });
  });

  const amostrasSheet: SpreadsheetSheet = {
    id: 'amostras',
    name: 'Amostras_RDC216',
    title: 'Livro de Registro e Coleta de Amostras RDC 216',
    description: 'Etiquetas térmicas e termos oficiais de guarda sanitária obrigatória (72 horas) por preparação.',
    columns: [
      { key: 'Linha', label: '#', width: '60px', type: 'number' },
      { key: 'ID_Amostra', label: 'Cód. Amostra', width: '140px', type: 'text' },
      { key: 'Data_Coleta', label: 'Data', width: '100px', type: 'date' },
      { key: 'Horario_Coleta', label: 'Horário', width: '80px', type: 'text' },
      { key: 'Dia_Semana', label: 'Dia', width: '120px', type: 'text' },
      { key: 'Preparacao_Alimento', label: 'Preparação Alimento', width: '220px', type: 'text' },
      { key: 'Categoria', label: 'Categoria', width: '140px', type: 'text' },
      { key: 'Temperatura_Padrao', label: 'Temp. Alvo', width: '130px', type: 'tag' },
      { key: 'Tempo_Guarda_Horas', label: 'Guarda', width: '90px', type: 'text' },
      { key: 'Norma_Sanitaria', label: 'Regulamento', width: '130px', type: 'text' },
    ],
    rows: amostrasRows,
    totalRows: amostrasRows.length,
    lastUpdated: now,
  };

  // 4. Sheet: Banco de Pratos
  const pratosRows: SpreadsheetRow[] = dishes.map((d, idx) => ({
    Linha: idx + 1,
    ID_Prato: d.id,
    Nome_Prato: d.name,
    Categoria: CATEGORY_LABELS[d.category as keyof typeof CATEGORY_LABELS] || d.category,
    Tipo_Buffet: d.menuType === 'kilo' ? 'Apenas Quilo' : d.menuType === 'rampa' ? 'Apenas Rampa' : 'Ambos os Cardápios',
    Descricao: d.description || '',
    Alergenos: d.allergens && d.allergens.length > 0 ? d.allergens.join(', ') : 'Nenhum declarado',
    Calorias_Kcal: d.calories || '—',
    Tags: d.tags && d.tags.length > 0 ? d.tags.join(', ') : 'Geral',
  }));

  const pratosSheet: SpreadsheetSheet = {
    id: 'pratos',
    name: 'Banco_Pratos',
    title: 'Catálogo Mestre do Banco de Pratos',
    description: 'Cadastro geral de receitas, categorias, alérgenos e adequação para Rampa ou Quilo.',
    columns: [
      { key: 'Linha', label: '#', width: '60px', type: 'number' },
      { key: 'ID_Prato', label: 'ID', width: '100px', type: 'text' },
      { key: 'Nome_Prato', label: 'Nome da Preparação', width: '220px', type: 'text' },
      { key: 'Categoria', label: 'Categoria', width: '150px', type: 'text' },
      { key: 'Tipo_Buffet', label: 'Destinação Buffet', width: '150px', type: 'tag' },
      { key: 'Alergenos', label: 'Alérgenos', width: '180px', type: 'text' },
      { key: 'Tags', label: 'Tags / Filtros', width: '150px', type: 'text' },
    ],
    rows: pratosRows,
    totalRows: pratosRows.length,
    lastUpdated: now,
  };

  // 5. Sheet: Usuários e Permissões
  const usuariosRows: SpreadsheetRow[] = users.map((u, idx) => ({
    Linha: idx + 1,
    ID_Usuario: u.id,
    Nome_Completo: u.name,
    Email_Institucional: u.email,
    Perfil_Acesso: u.role === 'master' 
      ? '👑 Administrador MASTER (Acesso Total)' 
      : u.role === 'admin' 
      ? '🛡️ Administrador Secundário (Edição)' 
      : u.role === 'cliente'
      ? '👤 Cliente (Rampa & Frutas)'
      : '👁️ Apenas Leitura (Consulta)',
    Setor_Departamento: u.department || 'Restaurante & Refeitório',
    Data_Cadastro: u.createdAt ? new Date(u.createdAt).toLocaleDateString('pt-BR') : '—',
    Ultimo_Acesso: u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('pt-BR') : 'Hoje',
  }));

  const usuariosSheet: SpreadsheetSheet = {
    id: 'usuarios',
    name: 'Usuarios_Permissoes',
    title: 'Controle de Acessos Institucionais (@cancaonova.com)',
    description: 'Lista de usuários, perfis de administrador ou leitura e departamentos autorizados.',
    columns: [
      { key: 'Linha', label: '#', width: '60px', type: 'number' },
      { key: 'ID_Usuario', label: 'ID', width: '110px', type: 'text' },
      { key: 'Nome_Completo', label: 'Nome Completo', width: '200px', type: 'text' },
      { key: 'Email_Institucional', label: 'E-mail Corporativo', width: '240px', type: 'text' },
      { key: 'Perfil_Acesso', label: 'Perfil de Acesso', width: '180px', type: 'tag' },
      { key: 'Setor_Departamento', label: 'Setor / Departamento', width: '180px', type: 'text' },
      { key: 'Ultimo_Acesso', label: 'Último Acesso', width: '120px', type: 'text' },
    ],
    rows: usuariosRows,
    totalRows: usuariosRows.length,
    lastUpdated: now,
  };

  // 6. Sheet: Log de Auditoria em Tempo Real
  const auditoriaRows: SpreadsheetRow[] = auditLog.map((log, idx) => ({
    Linha: idx + 1,
    Timestamp: log.timestamp,
    Usuario: log.user,
    Operacao: log.action,
    Entidade_Afetada: log.entity,
    Detalhes_Registro: log.details,
  }));

  const auditoriaSheet: SpreadsheetSheet = {
    id: 'auditoria',
    name: 'Log_Transacoes_Tempo_Real',
    title: 'Trilha de Auditoria & Registro de Ações em Tempo Real',
    description: 'Histórico contínuo de todas as alterações feitas no cardápio, quantidades, pratos e equipe.',
    columns: [
      { key: 'Linha', label: '#', width: '60px', type: 'number' },
      { key: 'Timestamp', label: 'Horário / Data', width: '160px', type: 'text' },
      { key: 'Usuario', label: 'Usuário Responsável', width: '180px', type: 'text' },
      { key: 'Operacao', label: 'Operação', width: '130px', type: 'tag' },
      { key: 'Entidade_Afetada', label: 'Módulo', width: '140px', type: 'text' },
      { key: 'Detalhes_Registro', label: 'Detalhes da Alteração', width: '320px', type: 'text' },
    ],
    rows: auditoriaRows,
    totalRows: auditoriaRows.length,
    lastUpdated: now,
  };

  // 7. Sheet: Pedidos de Refeição dos Usuários / Clientes (Rampa & Frutas)
  const pedidosRows: SpreadsheetRow[] = clientOrders.map((order, idx) => {
    const arrozItem = order.mealItems?.find((it) => it.category === 'arroz');
    const feijaoItem = order.mealItems?.find((it) => it.category === 'feijao');
    const principalItem = order.mealItems?.find((it) => it.category === 'principal');
    const guarnicaoItem = order.mealItems?.find((it) => it.category === 'guarnicao');
    const saladaItem = order.mealItems?.find((it) => it.category === 'salada');
    const sobremesaItem = order.mealItems?.find((it) => it.category === 'sobremesa');

    const fruitsSummary = order.fruits && order.fruits.length > 0
      ? order.fruits.map((f) => `${f.name}: ${f.quantity} ${f.unit}`).join('; ')
      : 'Sem frutas adicionais';

    const retention = getOrderRetentionInfo(order);

    return {
      Linha: idx + 1,
      Protocolo: order.orderNumber,
      Usuario_Solicitante: order.clientName,
      Email_Usuario: order.clientEmail,
      Setor_Grupo: order.departmentOrGroup,
      Telefone: order.clientPhone || 'Não informado',
      Data_Solicitacao: retention.referenceDateBr,
      Expira_Em: retention.statusLabel,
      Data_Refeicao: order.serviceDate,
      Dia_Semana: order.dayName || 'Rampa',
      Turno: order.mealShift,
      Arroz_Pessoas: arrozItem ? arrozItem.peopleCount : order.numberOfPeople,
      Feijao_Pessoas: feijaoItem ? feijaoItem.peopleCount : order.numberOfPeople,
      Principal_Pessoas: principalItem ? principalItem.peopleCount : order.numberOfPeople,
      Prato_Principal: principalItem?.dishName || 'Prato Principal',
      Guarnicao_Pessoas: guarnicaoItem ? guarnicaoItem.peopleCount : order.numberOfPeople,
      Salada_Pessoas: saladaItem ? saladaItem.peopleCount : order.numberOfPeople,
      Sobremesa_Pessoas: sobremesaItem ? sobremesaItem.peopleCount : order.numberOfPeople,
      Fruta_Escalada: fruitsSummary,
      Total_Comensais_Max: order.numberOfPeople,
      Status: order.status === 'aprovado' ? 'Aprovado' : order.status === 'em_preparo' ? 'Em Preparo' : order.status === 'entregue' ? 'Entregue' : 'Solicitado',
      Observacoes: order.specialDietNotes || '—',
    };
  });

  const pedidosSheet: SpreadsheetSheet = {
    id: 'pedidos',
    name: 'Pedidos_Usuarios_Rampa',
    title: 'Controle de Pedidos dos Usuários (Quantidades por Pessoa & Frutas)',
    description: 'Acompanhamento consolidado de todas as refeições solicitadas por usuário, com regra automática de exclusão do primeiro pedido a cada 8º dia corrido (ex: 08/10 → 15/10).',
    columns: [
      { key: 'Linha', label: '#', width: '50px', type: 'number' },
      { key: 'Protocolo', label: 'Protocolo', width: '120px', type: 'text' },
      { key: 'Data_Solicitacao', label: 'Data Pedido', width: '110px', type: 'date' },
      { key: 'Expira_Em', label: 'Auto-Exclusão (8º dia)', width: '185px', type: 'tag' },
      { key: 'Usuario_Solicitante', label: 'Usuário Solicitante', width: '200px', type: 'text' },
      { key: 'Email_Usuario', label: 'E-mail', width: '220px', type: 'text' },
      { key: 'Setor_Grupo', label: 'Setor / Grupo', width: '200px', type: 'text' },
      { key: 'Data_Refeicao', label: 'Data Refeição', width: '110px', type: 'text' },
      { key: 'Dia_Semana', label: 'Dia da Semana', width: '120px', type: 'text' },
      { key: 'Turno', label: 'Turno', width: '90px', type: 'tag' },
      { key: 'Arroz_Pessoas', label: 'Arroz (pax)', width: '95px', type: 'number' },
      { key: 'Feijao_Pessoas', label: 'Feijão (pax)', width: '95px', type: 'number' },
      { key: 'Principal_Pessoas', label: 'Principal (pax)', width: '110px', type: 'number' },
      { key: 'Prato_Principal', label: 'Prato Principal', width: '220px', type: 'text' },
      { key: 'Guarnicao_Pessoas', label: 'Guarnição (pax)', width: '110px', type: 'number' },
      { key: 'Salada_Pessoas', label: 'Salada (pax)', width: '95px', type: 'number' },
      { key: 'Sobremesa_Pessoas', label: 'Sobremesa (pax)', width: '115px', type: 'number' },
      { key: 'Fruta_Escalada', label: 'Fruta Escalada', width: '200px', type: 'text' },
      { key: 'Total_Comensais_Max', label: 'Total Comensais', width: '120px', type: 'number' },
      { key: 'Status', label: 'Status', width: '110px', type: 'tag' },
      { key: 'Observacoes', label: 'Observações / Restrições', width: '240px', type: 'text' },
    ],
    rows: pedidosRows,
    totalRows: pedidosRows.length,
    lastUpdated: now,
  };

  // 8. Sheet: Cálculo Diário de Produção por Prato/Alimento (baseado nos Pedidos)
  const dailySummaries = buildDailyOrderProductionSummaries(clientOrders);
  const calculoDiarioRows: SpreadsheetRow[] = [];
  let calcRowId = 1;

  dailySummaries.forEach((daySum) => {
    daySum.items.forEach((item) => {
      calculoDiarioRows.push({
        Linha: calcRowId++,
        Data_Refeicao: item.serviceDate,
        Dia_Semana: item.dayName,
        Categoria: item.categoryLabel,
        Prato_Alimento: item.dishName,
        Qtd_Pedidos: item.ordersCount,
        Total_Pessoas_PAX: item.totalPeople,
        Qtd_Preparar_Cozinha: item.estimatedAmount,
        Unidade: item.estimatedUnit,
        Base_Per_Capita: item.perCapitaLabel,
      });
    });
  });

  const calculoDiarioSheet: SpreadsheetSheet = {
    id: 'calculoDiario',
    name: 'Calculo_Diario_Cozinha',
    title: 'Somatória Diária de Pessoas, Pratos e Alimentos Separados por Dia',
    description: 'Cálculo consolidado por dia e por prato/alimento individual somando todas as solicitações para auxiliar o preparo diário na cozinha.',
    columns: [
      { key: 'Linha', label: '#', width: '50px', type: 'number' },
      { key: 'Data_Refeicao', label: 'Data', width: '110px', type: 'date' },
      { key: 'Dia_Semana', label: 'Dia da Semana', width: '130px', type: 'text' },
      { key: 'Categoria', label: 'Categoria', width: '150px', type: 'tag' },
      { key: 'Prato_Alimento', label: 'Prato / Alimento', width: '240px', type: 'text' },
      { key: 'Qtd_Pedidos', label: 'Pedidos', width: '80px', type: 'number' },
      { key: 'Total_Pessoas_PAX', label: 'Total Pessoas (PAX)', width: '140px', type: 'number' },
      { key: 'Qtd_Preparar_Cozinha', label: 'Qtd. p/ Fazer', width: '120px', type: 'number' },
      { key: 'Unidade', label: 'Unid.', width: '80px', type: 'tag' },
      { key: 'Base_Per_Capita', label: 'Per Capita', width: '140px', type: 'text' },
    ],
    rows: calculoDiarioRows,
    totalRows: calculoDiarioRows.length,
    lastUpdated: now,
  };

  const totalRecords =
    cardapiosRows.length +
    producaoRows.length +
    amostrasRows.length +
    pratosRows.length +
    usuariosRows.length +
    auditoriaRows.length +
    pedidosRows.length +
    calculoDiarioRows.length;

  return {
    title: 'Planilha Central CardápioPro Canção Nova (Database Integrado)',
    version: '3.0.0-LiveSpreadsheet',
    lastSyncedAt: now,
    totalRecords,
    sheets: {
      cardapios: cardapiosSheet,
      producao: producaoSheet,
      pedidos: pedidosSheet,
      calculoDiario: calculoDiarioSheet,
      amostras: amostrasSheet,
      pratos: pratosSheet,
      usuarios: usuariosSheet,
      auditoria: auditoriaSheet,
    },
  };
}

/**
 * Converts a spreadsheet sheet into a CSV string.
 */
export function sheetToCsv(sheet: SpreadsheetSheet): string {
  const headers = sheet.columns.map((c) => `"${c.label.replace(/"/g, '""')}"`).join(';');
  const rows = sheet.rows.map((row) =>
    sheet.columns
      .map((col) => {
        const val = row[col.key];
        if (val === null || val === undefined) return '""';
        return `"${String(val).replace(/"/g, '""')}"`;
      })
      .join(';')
  );
  return [headers, ...rows].join('\r\n');
}

/**
 * Converts a spreadsheet sheet into TSV (Tab Separated Values) format,
 * perfectly optimized for 1-click pasting directly into Google Sheets or Excel!
 */
export function sheetToTsv(sheet: SpreadsheetSheet): string {
  const headers = sheet.columns.map((c) => c.label).join('\t');
  const rows = sheet.rows.map((row) =>
    sheet.columns
      .map((col) => {
        const val = row[col.key];
        if (val === null || val === undefined) return '';
        return String(val).replace(/\t|\r?\n/g, ' ');
      })
      .join('\t')
  );
  return [headers, ...rows].join('\n');
}

/**
 * Downloads a sheet directly as a .csv file.
 */
export function downloadSheetAsCsv(sheet: SpreadsheetSheet, filenamePrefix = 'cardapiopro_planilha'): void {
  const csvContent = sheetToCsv(sheet);
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filenamePrefix}_${sheet.name}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Downloads all sheets in a single combined multi-section text file.
 */
export function downloadAllSheetsCsv(spreadsheet: SystemSpreadsheet): void {
  const sections: string[] = [];
  sections.push(`# PLANILHA CENTRAL DE GESTÃO DE CARDÁPIOS - RESTAURANTE CANÇÃO NOVA`);
  sections.push(`# Sincronização em tempo real: ${spreadsheet.lastSyncedAt}`);
  sections.push(`# Total de Registros Gravados: ${spreadsheet.totalRecords}`);
  sections.push('');

  Object.values(spreadsheet.sheets).forEach((sheet) => {
    sections.push(`=== ABA: ${sheet.name} (${sheet.title}) - ${sheet.totalRows} linhas ===`);
    sections.push(sheetToCsv(sheet));
    sections.push('');
  });

  const blob = new Blob(['\uFEFF' + sections.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `cardapiopro_planilha_completa_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Converts a WeeklyMenu into the exact weekly matrix TSV format (Columns = Mon..Sun, Rows = Categories),
 * allowing 1-click pasting into Google Sheets or Excel identical to the app's visual layout!
 */
export function weeklyMenuToMatrixTsv(menu: WeeklyMenu): string {
  const dayKeys = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'] as const;
  const headerCols = [
    'CATEGORIA NUTRICIONAL',
    `SEGUNDA (${menu.days.seg.dateStr})`,
    `TERÇA (${menu.days.ter.dateStr})`,
    `QUARTA (${menu.days.qua.dateStr})`,
    `QUINTA (${menu.days.qui.dateStr})`,
    `SEXTA (${menu.days.sex.dateStr})`,
    `SÁBADO (${menu.days.sab.dateStr})`,
    `DOMINGO (${menu.days.dom.dateStr})`,
  ];

  const categories: { key: keyof typeof menu.days.seg.lunch; label: string }[] =
    menu.menuType === 'kilo'
      ? [
          { key: 'principal', label: 'Prato Principal / Grelhado' },
          { key: 'grelhadoNobre', label: 'Grelhado Nobre Especial' },
          { key: 'massaEspecial', label: 'Massa Artesanal / Especial' },
          { key: 'guarnicao', label: 'Guarnição da Pista Quente' },
          { key: 'acompanhamento', label: 'Acompanhamentos Base' },
          { key: 'salada', label: 'Salada da Pista Fria' },
          { key: 'saladaEspecial', label: 'Salada Especial / Carpaccio' },
          { key: 'sobremesa', label: 'Sobremesa & Balcão' },
        ]
      : [
          { key: 'principal', label: 'Prato Principal' },
          { key: 'guarnicao', label: 'Guarnição' },
          { key: 'acompanhamento', label: 'Acompanhamentos Base' },
          { key: 'salada', label: 'Salada do Dia' },
          { key: 'sobremesa', label: 'Sobremesa' },
        ];

  const rows = categories.map((cat) => {
    const dayCells = dayKeys.map((dKey) => {
      const items = menu.days[dKey]?.lunch[cat.key];
      if (Array.isArray(items) && items.length > 0) {
        return items.filter(Boolean).join('; ');
      }
      return '—';
    });
    return [cat.label, ...dayCells].join('\t');
  });

  return [headerCols.join('\t'), ...rows].join('\n');
}

/**
 * Downloads the weekly matrix formatted as CSV matching the app's visual layout.
 */
export function downloadWeeklyMatrixCsv(menu: WeeklyMenu): void {
  const dayKeys = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'] as const;
  const headerCols = [
    '"CATEGORIA NUTRICIONAL"',
    `"SEGUNDA (${menu.days.seg.dateStr})"`,
    `"TERÇA (${menu.days.ter.dateStr})"`,
    `"QUARTA (${menu.days.qua.dateStr})"`,
    `"QUINTA (${menu.days.qui.dateStr})"`,
    `"SEXTA (${menu.days.sex.dateStr})"`,
    `"SÁBADO (${menu.days.sab.dateStr})"`,
    `"DOMINGO (${menu.days.dom.dateStr})"`,
  ];

  const categories: { key: keyof typeof menu.days.seg.lunch; label: string }[] =
    menu.menuType === 'kilo'
      ? [
          { key: 'principal', label: 'Prato Principal / Grelhado' },
          { key: 'grelhadoNobre', label: 'Grelhado Nobre Especial' },
          { key: 'massaEspecial', label: 'Massa Artesanal / Especial' },
          { key: 'guarnicao', label: 'Guarnição da Pista Quente' },
          { key: 'acompanhamento', label: 'Acompanhamentos Base' },
          { key: 'salada', label: 'Salada da Pista Fria' },
          { key: 'saladaEspecial', label: 'Salada Especial / Carpaccio' },
          { key: 'sobremesa', label: 'Sobremesa & Balcão' },
        ]
      : [
          { key: 'principal', label: 'Prato Principal' },
          { key: 'guarnicao', label: 'Guarnição' },
          { key: 'acompanhamento', label: 'Acompanhamentos Base' },
          { key: 'salada', label: 'Salada do Dia' },
          { key: 'sobremesa', label: 'Sobremesa' },
        ];

  const rows = categories.map((cat) => {
    const dayCells = dayKeys.map((dKey) => {
      const items = menu.days[dKey]?.lunch[cat.key];
      if (Array.isArray(items) && items.length > 0) {
        return `"${items.filter(Boolean).join('; ').replace(/"/g, '""')}"`;
      }
      return '"—"';
    });
    return [`"${cat.label}"`, ...dayCells].join(';');
  });

  const csvContent = [headerCols.join(';'), ...rows].join('\r\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `grade_cardapio_semanal_${menu.menuType}_ano${menu.year}_mes${menu.month}_sem${menu.weekNumber}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
