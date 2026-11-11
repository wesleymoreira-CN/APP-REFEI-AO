import { WeeklyMenu, RepetitionConflict, MealSlot, MenuType } from '../types';

/**
 * Validates if the email belongs strictly to @cancaonova.com or @*.cancaonova.com
 * Satisfies the requirement: "somente aceite emails que contenham @cancaonova.com"
 */
export function isValidCancaoNovaEmail(email: string): boolean {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();
  
  // Must match user@cancaonova.com or user@*.cancaonova.com (e.g. comunidadecancaonova.com)
  const regex = /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9-]+\.)?cancaonova\.com$/i;
  
  // Also support @comunidadecancaonova.com if requested by user email domain
  const comunidadeRegex = /^[a-zA-Z0-9._%+-]+@comunidadecancaonova\.com$/i;
  
  return regex.test(cleanEmail) || comunidadeRegex.test(cleanEmail) || cleanEmail.endsWith('@cancaonova.com');
}

export const CATEGORY_LABELS: Record<keyof MealSlot, string> = {
  principal: 'Prato Principal',
  alternativa: 'Opção Alternativa (Ave/Peixe)',
  vegetariano: 'Opção Vegetariana',
  guarnicao: 'Guarnição do Buffet',
  acompanhamento: 'Acompanhamentos Base',
  salada: 'Salada do Dia',
  sobremesa: 'Sobremesa',
  observacao: 'Observações do Dia',
  grelhadoNobre: 'Grelhado Nobre (Kilo)',
  massaEspecial: 'Massa / Especialidade (Kilo)',
  saladaEspecial: 'Pista Fria / Salada Especial (Kilo)',
};

// Base categories strictly audited for anti-repetition (min. 2 weeks spacing)
export const CHECKED_CATEGORIES: (keyof MealSlot)[] = [
  'principal',
  'alternativa',
  'vegetariano',
  'guarnicao',
  'sobremesa',
  'salada',
  'grelhadoNobre',
  'massaEspecial',
  'saladaEspecial'
];

/**
 * Accurately calculate day dates for any year, month, and week number
 * avoids duplicated 31/01 bugs!
 */
export function getWeekDates(year: number, month: number, weekNumber: number): {
  startFormatted: string;
  endFormatted: string;
  daysDates: { dayKey: string; dateStr: string; dayNumber: number }[];
} {
  const dayKeys = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
  
  // Base day for the week
  // Week 1: 1..7, Week 2: 8..14, Week 3: 15..21, Week 4: 22..28, Week 5: 29..end
  const startDayOfMonth = (weekNumber - 1) * 7 + 1;
  const daysDates: { dayKey: string; dateStr: string; dayNumber: number }[] = [];

  for (let i = 0; i < 7; i++) {
    const targetDate = new Date(year, month - 1, startDayOfMonth + i);
    const day = String(targetDate.getDate()).padStart(2, '0');
    const m = String(targetDate.getMonth() + 1).padStart(2, '0');
    daysDates.push({
      dayKey: dayKeys[i],
      dateStr: `${day}/${m}`,
      dayNumber: targetDate.getDate(),
    });
  }

  const startFormatted = daysDates[0].dateStr;
  const endFormatted = daysDates[6].dateStr;

  return { startFormatted, endFormatted, daysDates };
}

/**
 * Calculates the relative week (Year, Month, WeekNumber) given an offset delta.
 * Handles month roll-back (month < 1 => month 12, year - 1) and roll-forward (month > 12 => month 1, year + 1).
 */
export function getOffsetWeek(
  year: number,
  month: number,
  weekNumber: number,
  delta: number
): { year: number; month: number; weekNumber: number } {
  let y = year;
  let m = month;
  let w = weekNumber;

  if (delta > 0) {
    for (let i = 0; i < delta; i++) {
      w += 1;
      if (w > 4) {
        w = 1;
        m += 1;
        if (m > 12) {
          m = 1;
          y += 1;
        }
      }
    }
  } else if (delta < 0) {
    for (let i = 0; i < Math.abs(delta); i++) {
      w -= 1;
      if (w < 1) {
        w = 4;
        m -= 1;
        if (m < 1) {
          m = 12;
          y -= 1;
        }
      }
    }
  }

  return { year: y, month: m, weekNumber: w };
}

/**
 * Finds a weekly menu in the store for a specific relative offset.
 */
export function getMenuForOffset(
  menus: Record<string, WeeklyMenu>,
  currentYear: number,
  currentMonth: number,
  currentWeekNumber: number,
  delta: number,
  menuType: MenuType
): WeeklyMenu | undefined {
  const target = getOffsetWeek(currentYear, currentMonth, currentWeekNumber, delta);
  const key = `menu-${target.year}-${target.month}-w${target.weekNumber}-${menuType}`;
  if (menus[key]) return menus[key];

  // Try legacy key
  const legacyKey = `menu-${target.year}-${target.month}-w${target.weekNumber}`;
  if (menus[legacyKey]) return menus[legacyKey];

  return undefined;
}

/**
 * Normalizes any slot value into a clean array of strings
 */
export function normalizeSlotItems(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((item) => item.length > 0);
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return [];
    if (trimmed.includes('\n')) {
      return trimmed.split('\n').map((s) => s.trim()).filter(Boolean);
    }
    return [trimmed];
  }
  return [];
}

/**
 * Normalize dish name for comparison (removes accents, lowercase, extra spaces)
 */
export function normalizeDishName(name: string): string {
  if (!name) return '';
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

export interface ComparisonWeeksWindow {
  prevWeek2?: WeeklyMenu; // W-2 (2 semanas atrás)
  prevWeek1?: WeeklyMenu; // W-1 (semana anterior imediata)
  nextWeek1?: WeeklyMenu; // W+1 (semana seguinte imediata)
  nextWeek2?: WeeklyMenu; // W+2 (2 semanas à frente)
}

/**
 * Checks whether a single dish repeats within a 2-week window (W-2, W-1, W+1, W+2)
 * or in the same week on a different day.
 * Ensures the requirement: "tem que ter no mínimo um espaço de 2 semanas uma da outra".
 */
export function checkDishRepetition(
  dishName: string,
  category: keyof MealSlot,
  currentWeek: WeeklyMenu,
  windowWeeks: ComparisonWeeksWindow,
  targetDayKey?: string
): { isRepeated: boolean; conflicts: RepetitionConflict[] } {
  const normCurrent = normalizeDishName(dishName);
  if (!normCurrent || normCurrent.length < 3) {
    return { isRepeated: false, conflicts: [] };
  }

  // Staples like plain rice and generic beans served daily are exempted
  if (
    normCurrent.includes('arroz branco') ||
    normCurrent.includes('feijao carioca') ||
    normCurrent.includes('feijao preto')
  ) {
    return { isRepeated: false, conflicts: [] };
  }

  const conflicts: RepetitionConflict[] = [];
  const dayKeys: (keyof WeeklyMenu['days'])[] = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];

  // 1. Same-week check (dish shouldn't repeat on multiple days of the same week in the same category)
  if (targetDayKey) {
    for (const dKey of dayKeys) {
      if (dKey === targetDayKey) continue;
      const day = currentWeek.days[dKey];
      if (!day) continue;
      const itemsInSlot = normalizeSlotItems(day.lunch[category]);
      for (const item of itemsInSlot) {
        if (normalizeDishName(item) === normCurrent) {
          conflicts.push({
            dishName,
            category,
            categoryLabel: CATEGORY_LABELS[category],
            currentDayName: targetDayKey ? ((currentWeek.days as Record<string, any>)[targetDayKey]?.dayName || targetDayKey) : '',
            currentWeekNumber: currentWeek.weekNumber,
            currentMonth: currentWeek.month,
            currentYear: currentWeek.year,
            conflictDayName: day.dayName,
            conflictWeekNumber: currentWeek.weekNumber,
            conflictMonth: currentWeek.month,
            conflictYear: currentWeek.year,
            weeksDistance: 0,
            direction: 'atual',
            severity: 'high',
            reason: `Já está programado na ${day.dayName} desta mesma semana.`,
          });
        }
      }
    }
  }

  // Helper to audit an external week
  const auditExternalWeek = (
    week: WeeklyMenu | undefined,
    weeksDistance: 1 | 2,
    direction: 'anterior' | 'seguinte'
  ) => {
    if (!week) return;

    for (const dKey of dayKeys) {
      const day = week.days[dKey];
      if (!day) continue;

      const slotDishes = normalizeSlotItems(day.lunch[category]);
      for (const pDish of slotDishes) {
        if (normalizeDishName(pDish) === normCurrent) {
          const timingDesc =
            direction === 'anterior'
              ? weeksDistance === 1
                ? 'na semana passada (Semana ' + week.weekNumber + ')'
                : 'há 2 semanas (Semana ' + week.weekNumber + ')'
              : weeksDistance === 1
              ? 'na próxima semana (Semana ' + week.weekNumber + ')'
              : 'daqui a 2 semanas (Semana ' + week.weekNumber + ')';

          conflicts.push({
            dishName,
            category,
            categoryLabel: CATEGORY_LABELS[category],
            currentDayName: targetDayKey ? ((currentWeek.days as Record<string, any>)[targetDayKey]?.dayName || '') : '',
            currentWeekNumber: currentWeek.weekNumber,
            currentMonth: currentWeek.month,
            currentYear: currentWeek.year,
            conflictDayName: day.dayName,
            conflictWeekNumber: week.weekNumber,
            conflictMonth: week.month,
            conflictYear: week.year,
            weeksDistance,
            direction,
            severity: category === 'principal' || category === 'alternativa' ? 'high' : 'medium',
            reason: `Servido na ${day.dayName} ${timingDesc}. A regra exige no mínimo 2 semanas de intervalo.`,
          });
        }
      }
    }
  };

  // 2. Audit W-1 (Semana imediatamente anterior - distância 1)
  auditExternalWeek(windowWeeks.prevWeek1, 1, 'anterior');

  // 3. Audit W-2 (Duas semanas atrás - distância 2)
  auditExternalWeek(windowWeeks.prevWeek2, 2, 'anterior');

  // 4. Audit W+1 (Semana imediatamente seguinte - distância 1)
  auditExternalWeek(windowWeeks.nextWeek1, 1, 'seguinte');

  // 5. Audit W+2 (Duas semanas à frente - distância 2)
  auditExternalWeek(windowWeeks.nextWeek2, 2, 'seguinte');

  return {
    isRepeated: conflicts.length > 0,
    conflicts,
  };
}

/**
 * Actively validates if a dish can be added to a slot.
 * Strictly enforces:
 * "Não pode deixar acrescentar no cardápio, comidas que foram colocados na semana anterior, tem que ter no mínimo um espaço de 2 semanas uma da outra"
 */
export function validateDishAddition(
  dishName: string,
  category: keyof MealSlot,
  targetDayKey: string,
  currentWeek: WeeklyMenu,
  menus: Record<string, WeeklyMenu>,
  menuType: MenuType
): { allowed: boolean; reason?: string; conflict?: RepetitionConflict } {
  const normName = normalizeDishName(dishName);
  if (!normName) {
    return { allowed: false, reason: 'Nome do prato não informado.' };
  }

  // Exempt basic rice and bean combinations
  if (
    category === 'acompanhamento' &&
    (normName.includes('arroz') || normName.includes('feijao'))
  ) {
    return { allowed: true };
  }

  const windowWeeks: ComparisonWeeksWindow = {
    prevWeek2: getMenuForOffset(menus, currentWeek.year, currentWeek.month, currentWeek.weekNumber, -2, menuType),
    prevWeek1: getMenuForOffset(menus, currentWeek.year, currentWeek.month, currentWeek.weekNumber, -1, menuType),
    nextWeek1: getMenuForOffset(menus, currentWeek.year, currentWeek.month, currentWeek.weekNumber, 1, menuType),
    nextWeek2: getMenuForOffset(menus, currentWeek.year, currentWeek.month, currentWeek.weekNumber, 2, menuType),
  };

  const { isRepeated, conflicts } = checkDishRepetition(
    dishName,
    category,
    currentWeek,
    windowWeeks,
    targetDayKey
  );

  if (isRepeated && conflicts.length > 0) {
    const mainConflict = conflicts[0];
    const explanation =
      mainConflict.weeksDistance === 0
        ? `Bloqueado: O prato "${dishName}" já está no cardápio de ${mainConflict.conflictDayName} desta mesma semana.`
        : mainConflict.weeksDistance === 1 && mainConflict.direction === 'anterior'
        ? `Bloqueado: O prato "${dishName}" foi servido na semana anterior (${mainConflict.conflictDayName}, Semana ${mainConflict.conflictWeekNumber}). A diretriz exige no mínimo 2 semanas de intervalo.`
        : `Bloqueado: O prato "${dishName}" está registrado na ${mainConflict.conflictDayName} da Semana ${mainConflict.conflictWeekNumber} (Mês ${mainConflict.conflictMonth}). A diretriz exige no mínimo 2 semanas de intervalo entre repetições.`;

    return {
      allowed: false,
      reason: explanation,
      conflict: mainConflict,
    };
  }

  return { allowed: true };
}

/**
 * Scans an entire week for any repetition with previous and next 2 weeks.
 * Supports either ComparisonWeeksWindow or legacy (prevWeek, nextWeek) parameters.
 */
export function scanWeeklyRepetitions(
  currentWeek: WeeklyMenu,
  windowWeeksOrPrev?: ComparisonWeeksWindow | WeeklyMenu,
  nextWeekLegacy?: WeeklyMenu
): RepetitionConflict[] {
  let windowWeeks: ComparisonWeeksWindow = {};
  if (windowWeeksOrPrev) {
    if ('days' in windowWeeksOrPrev) {
      windowWeeks = {
        prevWeek1: windowWeeksOrPrev as WeeklyMenu,
        nextWeek1: nextWeekLegacy,
      };
    } else {
      windowWeeks = windowWeeksOrPrev as ComparisonWeeksWindow;
    }
  }

  const allConflicts: RepetitionConflict[] = [];
  const dayKeys: (keyof WeeklyMenu['days'])[] = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];

  for (const dayKey of dayKeys) {
    const day = currentWeek.days[dayKey];
    if (!day) continue;

    for (const cat of CHECKED_CATEGORIES) {
      const rawSlot = day.lunch[cat];
      const dishesInSlot = normalizeSlotItems(rawSlot);

      for (const singleDish of dishesInSlot) {
        const { isRepeated, conflicts } = checkDishRepetition(
          singleDish,
          cat,
          currentWeek,
          windowWeeks,
          dayKey
        );
        if (isRepeated) {
          conflicts.forEach((c) => {
            // Avoid duplicate conflict entries in the list
            const exists = allConflicts.some(
              (ac) =>
                ac.dishName.toLowerCase() === c.dishName.toLowerCase() &&
                ac.category === c.category &&
                ac.conflictWeekNumber === c.conflictWeekNumber &&
                ac.conflictDayName === c.conflictDayName &&
                ac.currentDayName === c.currentDayName
            );
            if (!exists) {
              allConflicts.push({
                ...c,
                currentDayName: day.dayName,
              });
            }
          });
        }
      }
    }
  }

  return allConflicts;
}

export const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
];
